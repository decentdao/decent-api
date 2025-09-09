import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/db';
import { DbProposal, schema } from '@/db/schema';
import { daoCheck } from '@/api/middleware/dao';
import resf, { ApiError } from '@/api/utils/responseFormatter';
import { bigIntText, formatProposal } from '@/api/utils/typeConverter';
import { addProposalTimestamp } from '../utils/blockTimestamp';

const app = new Hono();

/**
 * @title Get all proposals for a DAO
 * @route GET /d/{chainId}/{address}/proposals
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @returns {Proposal[]} Array of proposal objects
 * TODO: Unify types for multisig and module DAO
 */
app.get('/', daoCheck, async c => {
  const dao = c.get('dao');
  const isMultisig = dao?.governanceModules?.length === 0;

  if (isMultisig) {
    const proposals = await db.query.safeProposalTable.findMany({
      where: and(
        eq(schema.safeProposalTable.daoChainId, dao.chainId),
        eq(schema.safeProposalTable.daoAddress, dao.address),
      ),
      orderBy: desc(schema.safeProposalTable.safeNonce),
    });

    return resf(c, proposals);
  } else {
    const proposals = await db.query.onchainProposalTable.findMany({
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
            timestamp: true
          }
        },
      },
    }) as DbProposal[];

    const proposalsWithTimestamps = await Promise.all(
      proposals.map(proposal => addProposalTimestamp(proposal, dao.chainId))
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
app.get('/:id', daoCheck, async c => {
  const dao = c.get('dao');
  const { id } = c.req.param();
  if (!id) throw new ApiError('Proposal id is required', 400);

  const proposal = await db.query.onchainProposalTable.findFirst({
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
          timestamp: true
        }
      },
    },
  }) as DbProposal;

  if (!proposal) throw new ApiError('Proposal not found', 404);

  const proposalWithTimestamp = await addProposalTimestamp(proposal, dao.chainId);

  return resf(c, formatProposal(proposalWithTimestamp));
});

export default app;
