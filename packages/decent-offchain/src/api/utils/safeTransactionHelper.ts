import { Address } from 'viem';
import { getBlockTimestamp } from './blockTimestamp';
import { SupportedChainId } from 'decent-sdk';
import { getPublicClient } from './publicClient';
import { DbSafeProposal } from '@/db/schema/offchain/safeProposals';
import { getSafeInfo, getSafeTransactions } from '@/lib/safe';
import { FractalProposalState } from '../types';
import { db } from '@/db';

/**
 * Merge proposals from DB with their current state.
 *
 * Proposal State Flow:
 *
 * [Proposal]
 *   ├─ Executed? → EXECUTED
 *   ├─ Another proposal with same nonce executed? → REJECTED
 *   ├─ FreezeGuard exists?
 *   │     ├─ Not timelocked yet
 *   │     │     ├─ Enough approvals? → TIMELOCKABLE
 *   │     │     └─ Else → ACTIVE
 *   │     └─ Timelock active → TIMELOCKED
 *   │           └─ Execution period active → EXECUTABLE
 *   │             └─ Else → EXPIRED
 *   └─ No FreezeGuard
 *         ├─ Enough approvals & current nonce? → EXECUTABLE
 *         └─ Else → ACTIVE
 */
export async function mergeMultisigProposalsWithState(
  daoAddress: Address,
  chainId: SupportedChainId,
  proposals: DbSafeProposal[],
  freezeGuard?: Address,
) {
  if (proposals.length === 0) return [];

  // -----------------------
  // Fetch Safe info (threshold & current nonce)
  // -----------------------
  const safeInfo = await getSafeInfo(chainId, daoAddress);
  const currentSafeNonce = safeInfo.nonce;

  // -----------------------
  // Determine nowMs for timelock/execution
  // -----------------------
  const publicClient = getPublicClient(chainId);
  const blockNumber = await publicClient.getBlockNumber();
  const currentTimestamp = await getBlockTimestamp(Number(blockNumber), chainId);
  const nowMs = BigInt(currentTimestamp) * 1000n;

  // -----------------------
  // Fetch relevant Safe API transactions for active proposals
  // Only need nonce >= currentSafeNonce
  // -----------------------
  const safeTransactions = await getSafeTransactions(chainId, daoAddress, {
    nonceGte: currentSafeNonce,
  });
  const safeTxByHash = new Map(safeTransactions.results.map(tx => [tx.safeTxHash, tx]));

  // -----------------------
  // Fetch executed + timelocked proposals for only the current proposals
  // -----------------------
  const safeTxnHashes = proposals.map(p => p.safeTxHash);
  const executionRows = await db.query.safeProposalExecutionTable.findMany({
    where: (t, { eq, and, inArray }) =>
      and(
        eq(t.daoChainId, chainId),
        eq(t.daoAddress, daoAddress),
        inArray(t.safeTxnHash, safeTxnHashes),
      ),
  });

  // Map: nonce → executed safeTxnHash (from proposals)
  const executedNonceMap = new Map<number, string>();
  const timelockByTxHash = new Map<string, (typeof executionRows)[number]>();
  executionRows.forEach(row => {
    const proposal = proposals.find(p => p.safeTxHash === row.safeTxnHash);
    if (!proposal) return;
    if (row.executedTxHash) executedNonceMap.set(proposal.safeNonce, proposal.safeTxHash);
    if (row.timelockedBlock !== null && row.timelockedBlock !== undefined)
      timelockByTxHash.set(proposal.safeTxHash, row);
  });

  // -----------------------
  // Fetch FreezeGuard data from DB
  // -----------------------
  let freezeGuardData:
    | { guardTimelockPeriodMs: bigint; guardExecutionPeriodMs: bigint }
    | undefined;
  if (freezeGuard) {
    const guardRow = await db.query.governanceGuardTable.findFirst({
      where: (g, { eq }) =>
        eq(g.address, freezeGuard) && eq(g.daoChainId, chainId) && eq(g.daoAddress, daoAddress),
    });
    if (guardRow) {
      freezeGuardData = {
        guardTimelockPeriodMs: BigInt(guardRow.timelockPeriod || 0) * 1000n,
        guardExecutionPeriodMs: BigInt(guardRow.executionPeriod || 0) * 1000n,
      };
    }
  }

  // -----------------------
  // Helper: determine proposal state
  // -----------------------
  const determineProposalState = (proposal: DbSafeProposal): FractalProposalState => {
    // Executed
    if (executedNonceMap.get(proposal.safeNonce) === proposal.safeTxHash) {
      return FractalProposalState.EXECUTED;
    }

    // Rejected (another proposal with same nonce executed)
    if (executedNonceMap.has(proposal.safeNonce)) {
      return FractalProposalState.REJECTED;
    }

    // Get Safe transaction and approvals
    const safeTx = safeTxByHash.get(proposal.safeTxHash);
    const approvalsCount = safeTx?.confirmations?.length ?? 0;
    const hasEnoughApprovals = safeTx ? approvalsCount >= safeTx.confirmationsRequired : false;

    // No FreezeGuard
    if (!freezeGuardData) {
      return hasEnoughApprovals && proposal.safeNonce === currentSafeNonce
        ? FractalProposalState.EXECUTABLE
        : FractalProposalState.ACTIVE;
    }

    // FreezeGuard exists
    const timelockEvent = timelockByTxHash.get(proposal.safeTxHash);
    if (!timelockEvent) {
      return hasEnoughApprovals ? FractalProposalState.TIMELOCKABLE : FractalProposalState.ACTIVE;
    }

    // Timelocked state
    const timelockEndMs =
      BigInt(timelockEvent.timelockedBlock!) * 1000n + freezeGuardData.guardTimelockPeriodMs;

    if (nowMs <= timelockEndMs) return FractalProposalState.TIMELOCKED;

    const executionEndMs = timelockEndMs + freezeGuardData.guardExecutionPeriodMs;
    return nowMs < executionEndMs ? FractalProposalState.EXECUTABLE : FractalProposalState.EXPIRED;
  };

  return proposals.map(proposal => ({ ...proposal, state: determineProposalState(proposal) }));
}
