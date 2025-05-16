import { Hono } from 'hono';
import { eq, and, isNull } from 'drizzle-orm';
import { NewProposal, UpdateProposal, ProposalParams, Proposal } from 'decent-sdk';
import { abis } from '@fractal-framework/fractal-contracts';
import { decodeEventLog, getAbiItem, toFunctionSelector } from 'viem';
import { db } from '@/db';
import { DbNewProposal, DbProposal, schema } from '@/db/schema';
import resf, { ApiError } from '@/api/utils/responseFormatter';
import { bearerAuth } from '@/api/middleware/auth';
import { daoCheck } from '@/api/middleware/dao';
import { permissionsCheck } from '@/api/middleware/permissions';
import { formatOnchainProposal, formatProposal, OnchainProposal } from '@/api/utils/typeConverter';
import { WebSocketConnections } from '../ws/connections';
import { Topics } from '../ws/topics';
import { duneFetchTransactions } from '@/lib/dune';

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
  const proposals = await db.query.proposalTable.findMany({
    where: and(
      eq(schema.proposalTable.daoChainId, dao.chainId),
      eq(schema.proposalTable.daoAddress, dao.address),
    ),
  });

  const ret: Proposal[] = proposals.map(formatProposal);
  return resf(c, ret);
});

/**
 * @title Fetch all onchain proposals for a DAO
 * @route POST /d/{chainId}/{address}/proposals/sync
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @returns {string} 'ok'
 */
app.get('/sync', daoCheck, async c => {
  const dao = c.get('dao');
  const azoriusAddress = dao.governanceModules?.[0]?.address;
  if (!azoriusAddress) throw new ApiError('Azorius governance module not found', 404);

  const submitProposalMethodId = toFunctionSelector(
    getAbiItem({
      abi: abis.Azorius,
      name: 'submitProposal',
    }),
  );

  const { transactions } = await duneFetchTransactions(azoriusAddress, {
    chainIds: String(dao.chainId),
    method_id: submitProposalMethodId,
    decode: true,
  });

  const proposals: DbNewProposal[] = [];
  transactions.forEach(t => {
    if (!t.success) return;
    const decodedProposalCreated = decodeEventLog({
      abi: abis.Azorius,
      data: t?.logs[1]?.data,
      topics: [t?.logs[1]?.topics[0] ?? '0x'],
    });

    const proposal = formatOnchainProposal(decodedProposalCreated.args as OnchainProposal);

    if (!proposal) return;

    proposals.push({
      ...proposal,
      daoChainId: dao.chainId,
      daoAddress: dao.address,
      proposedTxHash: t.hash,
      createdAt: new Date(t.block_time),
    });
  });

  if (proposals.length < 1) throw new ApiError('No proposals found', 404);
  await db.insert(schema.proposalTable).values(proposals).onConflictDoNothing()

  return resf(c, 'ok');
});

/**
 * @title Create a proposal
 * @route POST /d/{chainId}/{address}/proposals
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @param {NewProposal} [body] NewProposal object
 * @returns {Proposal} Proposal object
 */
app.post('/', daoCheck, bearerAuth, permissionsCheck, async c => {
  const user = c.get('user');
  if (!user) throw new ApiError('user not found', 401);
  if (!user.permissions?.isProposer)
    throw new ApiError('User does not have proposer permissions', 403);
  const dao = c.get('dao');
  const { title, body, votingStrategyAddress, voteType, voteChoices, cycle } =
    (await c.req.json()) as NewProposal;
  const proposal: DbProposal[] = await db
    .insert(schema.proposalTable)
    .values({
      daoChainId: dao.chainId,
      daoAddress: dao.address,
      authorAddress: user.address,
      title,
      body,
      votingStrategyAddress,
      voteType,
      voteChoices,
      cycle,
    })
    .returning();

  if (!proposal.length || !proposal[0]) throw new ApiError('Failed to create proposal', 500);

  const ret: Proposal = formatProposal(proposal[0]);
  WebSocketConnections.updated(Topics.proposals(dao.chainId, dao.address), ret);
  return resf(c, ret);
});

/**
 * @title Get a proposal by slug
 * @route GET /d/{chainId}/{address}/proposals/{slug}
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @param {string} slug - Slug or id of the proposal
 * @returns {Proposal} Proposal object
 */
app.get('/:slug', daoCheck, async c => {
  const dao = c.get('dao');
  const { slug } = c.req.param() as ProposalParams;
  if (!slug) throw new ApiError('Proposal slug or id is required', 400);
  const slugIsNumber = !Number.isNaN(Number(slug));
  const slugOrId = slugIsNumber
    ? eq(schema.proposalTable.id, Number(slug))
    : eq(schema.proposalTable.slug, slug);

  const proposal = await db.query.proposalTable.findFirst({
    where: and(
      slugOrId,
      eq(schema.proposalTable.daoChainId, dao.chainId),
      eq(schema.proposalTable.daoAddress, dao.address),
    ),
  });

  if (!proposal) throw new ApiError('Proposal not found', 404);

  const ret: Proposal = formatProposal(proposal);
  return resf(c, ret);
});

/**
 * @title Update a proposal
 * @route PUT /d/{chainId}/{address}/proposals/{slug}
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @param {string} slug - Slug or id of the proposal
 * @param {UpdateProposal} [body] UpdateProposal object
 * @returns {Proposal} Proposal object
 */
app.put('/:slug', daoCheck, bearerAuth, permissionsCheck, async c => {
  const { slug } = c.req.param() as ProposalParams;
  if (!slug) throw new ApiError('Proposal slug is required', 400);
  const user = c.get('user');
  if (!user) throw new ApiError('user not found', 401);
  if (!user.permissions?.isProposer)
    throw new ApiError('User does not have proposer permissions', 403);
  const { title, body, voteType, voteChoices, cycle } = (await c.req.json()) as UpdateProposal;
  const proposal = await db
    .update(schema.proposalTable)
    .set({
      title,
      body,
      voteType,
      voteChoices,
      cycle,
    })
    .where(
      and(
        eq(schema.proposalTable.slug, slug),
        eq(schema.proposalTable.authorAddress, user.address), // only the author can update the proposal
        isNull(schema.proposalTable.proposedTxHash), // only proposals that have not been put onchain can be updated
      ),
    )
    .returning();

  if (!proposal.length || !proposal[0]) {
    throw new ApiError('Proposal not found or you are not the author', 403);
  }

  const ret: Proposal = formatProposal(proposal[0]);
  const dao = c.get('dao');
  WebSocketConnections.updated(Topics.proposals(dao.chainId, dao.address), ret);
  return resf(c, ret);
});

export default app;
