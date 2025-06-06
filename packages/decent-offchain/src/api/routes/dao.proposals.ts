import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { schema } from '@/db/schema';
import { daoCheck } from '@/api/middleware/dao';
import resf, { ApiError } from '@/api/utils/responseFormatter';
import { formatProposal } from '@/api/utils/typeConverter';
import { formatTx } from '@/api/utils/decodeTxData';

const app = new Hono();

/**
 * @title Get all proposals for a DAO
 * @route GET /d/{chainId}/{address}/proposals
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @returns {Proposal[]} Array of proposal objects
 */
app.get('/', daoCheck, async c => {
  const dao = c.get('dao');
  const proposals = await db.query.onchainProposalTable.findMany({
    where: and(
      eq(schema.onchainProposalTable.daoChainId, dao.chainId),
      eq(schema.onchainProposalTable.daoAddress, dao.address),
    ),
  });

  const ret = proposals.map(formatProposal);
  return resf(c, ret);
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
  });

  if (!proposal) throw new ApiError('Proposal not found', 404);

  const ret = formatProposal(proposal);
  return resf(c, ret);
});

/**
 * @title Decode proposal transaction data
 * @route GET /d/{chainId}/{address}/proposals/:id/decode
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @param {string} id - id of the proposal
 * @returns {string} 'ok'
 */
app.get('/:id/decode', daoCheck, async c => {
  const { id } = c.req.param();
  if (!id) throw new ApiError('Proposal id is required', 400);

  const dao = c.get('dao');
  const proposal = await db.query.onchainProposalTable.findFirst({
    where: and(
      eq(schema.onchainProposalTable.id, Number(id)),
      eq(schema.onchainProposalTable.daoChainId, dao.chainId),
      eq(schema.onchainProposalTable.daoAddress, dao.address),
    ),
  });

  if (!proposal) throw new ApiError('Proposal not found', 404);

  const decoded = await Promise.all(
    proposal.transactions?.map(tx => formatTx(tx, dao.chainId)) || [],
  );
  const stringifiedDecoded = JSON.stringify(decoded, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value,
  );

  console.log(`Decoded transactions for proposal ${proposal.id}:`, stringifiedDecoded);
  await db
    .update(schema.onchainProposalTable)
    .set({
      decodedTransactions: stringifiedDecoded,
    })
    .where(
      and(
        eq(schema.onchainProposalTable.id, proposal.id),
        eq(schema.onchainProposalTable.daoChainId, dao.chainId),
        eq(schema.onchainProposalTable.daoAddress, dao.address),
      ),
    );

  return resf(c, decoded);
});

export default app;
