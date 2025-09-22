import { Address } from 'viem';
import { getBlockTimestamp } from './blockTimestamp';
import { SupportedChainId } from 'decent-sdk';
import { getPublicClient } from './publicClient';
import { DbSafeProposal } from '@/db/schema/offchain/safeProposals';
import { getSafeInfo, getSafeTransactions } from '@/lib/safe';
import { FractalProposalState, strategyFractalProposalStates } from '../types';
import { db } from '@/db';
import { abis } from '@fractal-framework/fractal-contracts';
import { DbProposal } from '@/db/schema';

/**
 * Merge proposals from DB with their current state.
 *
 * State machine (simplified):
 *
 * [Proposal]
 *   ├─ Nonce < currentSafeNonce (old proposals)
 *   │     ├─ Executed → EXECUTED
 *   │     └─ Another same-nonce executed → REJECTED
 *   │
 *   └─ Nonce >= currentSafeNonce (active proposals)
 *         ├─ FreezeGuard enabled?
 *         │     ├─ Not timelocked yet
 *         │     │     ├─ Enough approvals → TIMELOCKABLE
 *         │     │     └─ Else → ACTIVE
 *         │     └─ Timelock active
 *         │           ├─ Execution period active → EXECUTABLE
 *         │           └─ Else → EXPIRED
 *         └─ No FreezeGuard
 *               ├─ Enough approvals & current nonce → EXECUTABLE
 *               └─ Else → ACTIVE
 *
 * Optimization notes:
 * 1. Old proposals (nonce < currentSafeNonce) are final states → no RPC or FreezeGuard reads needed.
 * 2. Only active proposals (nonce >= currentSafeNonce) require:
 *    - Safe API transactions for approval counts
 *    - FreezeGuard contract reads and timelock DB queries (if freezeGuard is defined)
 * 3. DB queries are scoped to relevant proposals:
 *    - Executed proposals: only oldProposals
 *    - Timelocked proposals: only activeProposals if freezeGuard exists
 */
export async function mergeMultisigProposalsWithState(
  daoAddress: Address,
  chainId: SupportedChainId,
  proposals: DbSafeProposal[],
) {
  if (proposals.length === 0) return [];

  // -----------------------
  // Fetch freeze guard info internally
  // -----------------------
  const guardRow = await db.query.governanceGuardTable.findFirst({
    where: (g, { eq, and }) => and(eq(g.daoChainId, chainId), eq(g.daoAddress, daoAddress)),
  });

  // -----------------------
  // Fetch Safe info (threshold & current nonce)
  // -----------------------
  const safeInfo = await getSafeInfo(chainId, daoAddress);
  const currentSafeNonce = safeInfo.nonce;

  // -----------------------
  // Split proposals by nonce
  // -----------------------
  const oldProposals = proposals.filter(p => p.safeNonce < currentSafeNonce);
  const activeProposals = proposals.filter(p => p.safeNonce >= currentSafeNonce);

  // Early return if nothing to process
  if (oldProposals.length === 0 && activeProposals.length === 0) return [];

  // -----------------------
  // Fetch executed proposals for oldProposals
  // -----------------------
  const oldProposalHashes = oldProposals.map(p => p.safeTxHash);
  // prettier-ignore
  const executedRows = oldProposalHashes.length
    ? await db.query.safeProposalExecutionTable.findMany({
      where: (t, { eq, and, inArray, isNotNull }) =>
        and(
          eq(t.daoChainId, chainId),
          eq(t.daoAddress, daoAddress),
          inArray(t.safeTxnHash, oldProposalHashes),
          isNotNull(t.executedTxHash),
        ),
    })
    : [];

  const executedHashSet = new Set(executedRows.map(e => e.safeTxnHash));

  // Map nonce → executed hash for oldProposals
  const executedNonceMap = new Map<number, string>();
  for (const p of oldProposals) {
    if (executedHashSet.has(p.safeTxHash)) {
      executedNonceMap.set(p.safeNonce, p.safeTxHash);
    }
  }

  // -----------------------
  // Assign state to oldProposals (final)
  // -----------------------
  const oldProposalsWithState = oldProposals.map(p => {
    if (executedNonceMap.get(p.safeNonce) === p.safeTxHash) {
      return { ...p, state: FractalProposalState.EXECUTED };
    } else {
      return { ...p, state: FractalProposalState.REJECTED };
    }
  });

  // If no active proposals or no FreezeGuard, we can return early
  if (activeProposals.length === 0)
    return oldProposalsWithState.sort((a, b) => b.safeNonce - a.safeNonce);

  // -----------------------
  // Only compute for activeProposals
  // -----------------------
  let freezeGuardData: { guardTimelockPeriod: bigint; guardExecutionPeriod: bigint } | undefined;
  if (guardRow) {
    freezeGuardData = {
      guardTimelockPeriod: BigInt(guardRow.timelockPeriod || 0),
      guardExecutionPeriod: BigInt(guardRow.executionPeriod || 0),
    };
  }

  // -----------------------
  // Determine nowMs only if needed
  // -----------------------
  // prettier-ignore
  const nowSecond =
    freezeGuardData || activeProposals.length > 0
      ? BigInt(
        await getBlockTimestamp(Number(await getPublicClient(chainId).getBlockNumber()), chainId),
      )
      : 0n;

  // -----------------------
  // Fetch Safe API transactions for active proposals
  // Only need nonce >= currentSafeNonce
  // -----------------------
  const safeTransactions = await getSafeTransactions(chainId, daoAddress, {
    nonceGte: currentSafeNonce,
  });
  const safeTxByHash = new Map(safeTransactions.results.map(tx => [tx.safeTxHash, tx]));

  // -----------------------
  // Fetch timelocked events only if FreezeGuard exists
  // -----------------------
  const activeProposalHashes = activeProposals.map(p => p.safeTxHash);
  // prettier-ignore
  const timelockEvents = freezeGuardData
    ? await db.query.safeProposalExecutionTable.findMany({
      where: (t, { eq, and, inArray, isNotNull }) =>
        and(
          eq(t.daoChainId, chainId),
          eq(t.daoAddress, daoAddress),
          inArray(t.safeTxnHash, activeProposalHashes),
          isNotNull(t.timelockedBlock),
        ),
    })
    : [];
  const timelockByTxHash = new Map(timelockEvents.map(e => [e.safeTxnHash, e]));

  // -----------------------
  // Helper: determine proposal state for activeProposals
  // -----------------------
  const determineProposalState = async (
    proposal: DbSafeProposal,
  ): Promise<FractalProposalState> => {
    const safeTx = safeTxByHash.get(proposal.safeTxHash);
    const approvalsCount = safeTx?.confirmations?.length ?? 0;
    const hasEnoughApprovals = safeTx ? approvalsCount >= safeTx.confirmationsRequired : false;

    if (!freezeGuardData) {
      return hasEnoughApprovals && proposal.safeNonce === currentSafeNonce
        ? FractalProposalState.EXECUTABLE
        : FractalProposalState.ACTIVE;
    }

    const timelockEvent = timelockByTxHash.get(proposal.safeTxHash);
    if (!timelockEvent || timelockEvent.timelockedBlock === null) {
      return hasEnoughApprovals ? FractalProposalState.TIMELOCKABLE : FractalProposalState.ACTIVE;
    }

    const timelockEnd =
      BigInt(await getBlockTimestamp(timelockEvent.timelockedBlock, chainId)) +
      freezeGuardData.guardTimelockPeriod;
    if (nowSecond <= timelockEnd) return FractalProposalState.TIMELOCKED;

    const executionEnd = timelockEnd + freezeGuardData.guardExecutionPeriod;
    return nowSecond < executionEnd
      ? FractalProposalState.EXECUTABLE
      : FractalProposalState.EXPIRED;
  };

  const activeProposalsWithState = await Promise.all(
    activeProposals.map(async p => ({
      ...p,
      state: await determineProposalState(p),
    })),
  );

  // -----------------------
  // Merge and return in nonce descending order
  // -----------------------
  return [...oldProposalsWithState, ...activeProposalsWithState].sort(
    (a, b) => b.safeNonce - a.safeNonce,
  );
}

/**
 * Merge on-chain Azorius proposals with their current state from the contract.
 */
export async function mergeAzoriusProposalsWithState(
  daoAddress: Address,
  chainId: SupportedChainId,
  proposals: Pick<DbProposal, 'id'>[],
) {
  if (proposals.length === 0) return [];

  // -----------------------
  // Fetch Azorius module info internally
  // -----------------------
  const moduleRow = await db.query.governanceModuleTable.findFirst({
    where: (m, { eq, and }) => and(eq(m.daoChainId, chainId), eq(m.daoAddress, daoAddress)),
  });

  if (!moduleRow?.address) {
    // No Azorius module found, return proposals without state
    return proposals.map(p => ({ ...p, state: FractalProposalState.ACTIVE }));
  }

  const azoriusAddress = moduleRow.address;
  const client = getPublicClient(chainId);

  // Extract proposal IDs as BigInt (uint32 in Solidity)
  const proposalIds = proposals.map(p => BigInt(p.id));

  // Prepare multicall inputs
  const calls = proposalIds.map(id => ({
    address: azoriusAddress,
    abi: abis.Azorius,
    functionName: 'proposalState',
    args: [id],
  }));

  // Execute multicall
  const statesResponses = await client.multicall({ contracts: calls, allowFailure: true });
  const states = statesResponses.map(response => (response.result as number) || 0);

  // Map numeric ProposalState to FractalProposalState enum
  const proposalsWithState = proposals.map((p, i) => ({
    ...p,
    state: strategyFractalProposalStates[states[i]!],
  }));

  return proposalsWithState;
}
