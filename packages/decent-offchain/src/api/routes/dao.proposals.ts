import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/db';
import { DbProposal, schema } from '@/db/schema';
import { daoExists } from '@/api/middleware/dao';
import resf, { ApiError } from '@/api/utils/responseFormatter';
import { bigIntText, formatProposal } from '@/api/utils/typeConverter';
import { addVoteEndTimestamp } from '../utils/blockTimestamp';
import {
  mergeAzoriusProposalsWithState,
  mergeMultisigProposalsWithState,
} from '../utils/proposalStateHelpers';
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
app.get('/', daoExists, async c => {
  const dao = c.get('basicDaoInfo');

  if (!dao.isAzorius) {
    // Then it's Multisig DAO
    const proposals = await db.query.safeProposalTable.findMany({
      where: and(
        eq(schema.safeProposalTable.daoChainId, dao.chainId),
        eq(schema.safeProposalTable.daoAddress, dao.address),
      ),
    });
    const proposalsWithState = await mergeMultisigProposalsWithState(
      dao.address,
      dao.chainId,
      proposals,
    );

    return resf(c, proposalsWithState);
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

    const ret = await mergeAzoriusProposalsWithState(
      dao.address,
      dao.chainId,
      proposalsWithTimestamps.map(formatProposal),
    );
    return resf(c, ret);
  }
});

/**
 * @title Get a proposal by id
 * @route GET /d/{chainId}/{address}/proposals/{id}
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @param {string} id - id of the proposal,
 *   safeTxHash for Multisig DAO and proposalId for Azorius DAO
 * @returns {Proposal} Proposal object
 */
app.get('/:id', daoExists, async c => {
  const dao = c.get('basicDaoInfo');
  const { id } = c.req.param();
  if (!id) throw new ApiError('Proposal id is required', 400);

  if (!dao.isAzorius) {
    // Then it's Multisig DAO
    const proposal = await db.query.safeProposalTable.findFirst({
      where: and(
        eq(schema.safeProposalTable.daoChainId, dao.chainId),
        eq(schema.safeProposalTable.daoAddress, dao.address),
        eq(schema.safeProposalTable.safeTxHash, id as Hex),
      ),
    });
    if (!proposal) throw new ApiError('Proposal not found', 404);
    const proposalsWithState = await mergeMultisigProposalsWithState(dao.address, dao.chainId, [
      proposal,
    ]);

    return resf(c, proposalsWithState[0]);
  } else {
    const proposal = (await db.query.onchainProposalTable.findFirst({
      where: and(
        eq(schema.onchainProposalTable.daoChainId, dao.chainId),
        eq(schema.onchainProposalTable.daoAddress, dao.address),
        eq(schema.onchainProposalTable.id, Number(id)),
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
    })) as DbProposal | undefined;
    if (!proposal) throw new ApiError('Proposal not found', 404);
    const proposalWithTimestamp = await addVoteEndTimestamp(proposal, dao.chainId);

    const ret = await mergeAzoriusProposalsWithState(
      dao.address,
      dao.chainId,
      [proposalWithTimestamp].map(formatProposal),
    );
    return resf(c, ret);
  }
});

export default app;
