import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/db';
import { DbProposal, schema } from '@/db/schema';
import { daoExists, moduleGuardFetch } from '@/api/middleware/dao';
import resf, { ApiError } from '@/api/utils/responseFormatter';
import { bigIntText, formatProposal } from '@/api/utils/typeConverter';
import { addVoteEndTimestamp } from '../utils/blockTimestamp';
import { FractalProposalState } from '../types';
import {
  getFreezeGuardData,
  getTxTimelockedTimestamp,
  isApproved,
  isRejected,
} from '../utils/safeTransactionHelper';
import { getSafeTransactions } from '@/lib/safe';
import { Hex } from 'viem';

const app = new Hono();

/**
 * @title Get all proposals for a DAO
 * @route GET /d/{chainId}/{address}/proposals
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @returns {Proposal[]} Array of proposal objects
 * TODO: Unify types for multisig and module DAO
 */
app.get('/', daoExists, moduleGuardFetch, async c => {
  const dao = c.get('basicDaoInfo');
  const moduleGuard = c.get('moduleGuardInfo');

  if (!dao.isAzorius) {
    // Then it's Multisig DAO
    const proposals = await db.query.safeProposalTable.findMany({
      where: and(
        eq(schema.safeProposalTable.daoChainId, dao.chainId),
        eq(schema.safeProposalTable.daoAddress, dao.address),
      ),
      orderBy: desc(schema.safeProposalTable.safeNonce),
    });

    const safeTransactionListResponse = await getSafeTransactions(dao.chainId, dao.address);

    // Let's calculate proposal status
    const proposalsWithState = await Promise.all(
      proposals.map(async proposal => {
        let state: FractalProposalState | null = null;
        if (proposal.executedTxHash !== null) {
          // the transaction has already been executed
          state = FractalProposalState.EXECUTED;
        } else if (isRejected(proposals, proposal)) {
          // a different transaction with the same nonce has already
          // been executed, so this is no longer valid
          state = FractalProposalState.REJECTED;
        } else {
          // it's not executed or rejected, so we need to check the timelock status
          const freezeGuard = moduleGuard.guards[0];
          const freezeGuardData = await getFreezeGuardData(freezeGuard, dao.chainId);

          if (freezeGuard === undefined || freezeGuardData === undefined) {
            // FIXME fetch active nonce from SafeInfo?
            if (isApproved(proposal) && proposal.safeNonce === safeTransactionListResponse.count) {
              state = FractalProposalState.EXECUTABLE;
            } else {
              state = FractalProposalState.ACTIVE;
            }
          } else {
            const safeTransaction = safeTransactionListResponse.results.find(
              r => r.safeTxHash === proposal.safeTxHash,
            );
            if (safeTransaction && safeTransaction.signatures !== null) {
              const timelockedTimestampMs =
                (await getTxTimelockedTimestamp(
                  safeTransaction.signatures as Hex,
                  freezeGuard,
                  dao.chainId,
                )) * 1000;
              if (timelockedTimestampMs === 0) {
                // not yet timelocked
                if (isApproved(proposal)) {
                  // the proposal has enough signatures, so it can now be timelocked
                  state = FractalProposalState.TIMELOCKABLE;
                } else {
                  // not enough signatures on the proposal, it's still active
                  state = FractalProposalState.ACTIVE;
                }
              } else {
                // the proposal has been timelocked
                const timeLockPeriodEndMs =
                  timelockedTimestampMs + Number(freezeGuardData.guardTimelockPeriodMs);
                const nowMs = freezeGuardData.lastBlockTimestamp * 1000;
                if (nowMs > timeLockPeriodEndMs) {
                  // Timelock has ended, check execution period
                  const executionPeriodEndMs =
                    timeLockPeriodEndMs + Number(freezeGuardData.guardExecutionPeriodMs);
                  if (nowMs < executionPeriodEndMs) {
                    // Within execution period
                    state = FractalProposalState.EXECUTABLE;
                  } else {
                    // Execution period has ended
                    state = FractalProposalState.EXPIRED;
                  }
                } else {
                  // Still within timelock period
                  state = FractalProposalState.TIMELOCKED;
                }
              }
            } else {
              state = FractalProposalState.UNKNOWN;
            }
          }
        }

        return { ...proposal, state };
      }),
    );
    console.debug(
      'withState',
      proposalsWithState.map(ps => {
        return {
          title: ps.title,
          description: ps.description,
          state: ps.state,
        };
      }),
    );

    return resf(c, proposals);
  } else {
    const proposals = (await db.query.onchainProposalTable.findMany({
      where: and(
        eq(schema.onchainProposalTable.daoChainId, dao.chainId),
        eq(schema.onchainProposalTable.daoAddress, dao.address),
      ),
      orderBy: desc(schema.onchainProposalTable.id),
      with: {
        votes: {
          extras: {
            weight: bigIntText(schema.voteTable.weight),
          },
        },
        blockTimestamp: {
          columns: {
            timestamp: true,
          },
        },
      },
    })) as DbProposal[];

    const proposalsWithTimestamps = await Promise.all(
      proposals.map(proposal => addVoteEndTimestamp(proposal, dao.chainId)),
    );

    const ret = proposalsWithTimestamps.map(formatProposal);
    return resf(c, ret);
  }
});

/**
 * @title Get a proposal by id
 * @route GET /d/{chainId}/{address}/proposals/{id}
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @param {string} id - id of the proposal
 * @returns {Proposal} Proposal object
 */
app.get('/:id', daoExists, async c => {
  const dao = c.get('basicDaoInfo');
  const { id } = c.req.param();
  if (!id) throw new ApiError('Proposal id is required', 400);

  const proposal = (await db.query.onchainProposalTable.findFirst({
    where: and(
      eq(schema.onchainProposalTable.id, Number(id)),
      eq(schema.onchainProposalTable.daoChainId, dao.chainId),
      eq(schema.onchainProposalTable.daoAddress, dao.address),
    ),
    with: {
      votes: {
        extras: {
          weight: bigIntText(schema.voteTable.weight),
        },
      },
      blockTimestamp: {
        columns: {
          timestamp: true,
        },
      },
    },
  })) as DbProposal;

  if (!proposal) throw new ApiError('Proposal not found', 404);

  const proposalWithTimestamp = await addVoteEndTimestamp(proposal, dao.chainId);

  return resf(c, formatProposal(proposalWithTimestamp));
});

export default app;
