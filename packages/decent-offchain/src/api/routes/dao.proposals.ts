import { Hono } from 'hono';
import { Address } from 'viem';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { schema } from '@/db/schema';
import resf, { ApiError } from '@/api/utils/responseFormatter';
import { siweAuth } from '@/api/middleware/auth';
import { daoCheck } from '@/api/middleware/dao';
import { NewProposal, UpdateProposal } from '@/api/types/Proposal';
import { permissionsCheck } from '@/api/middleware/permissions';

const app = new Hono();

type ProposalParams = {
  chainId: string;
  address: Address;
  slug?: string;
}

/**
 * @title Get all proposals for a DAO
 * @route GET /d/{chainId}/{address}/proposals
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @returns {Proposal[]} Array of proposal objects
 */
app.get('/', daoCheck, async (c) => {
  const dao = c.get('dao');
  const proposals = await db.query.proposalTable.findMany({
    where: and(
      eq(schema.proposalTable.daoChainId, dao.chainId),
      eq(schema.proposalTable.daoAddress, dao.address)
    )
  });

  return resf(c, proposals);
});

/**
 * @title Create a proposal
 * @route POST /d/{chainId}/{address}/proposals
 * @body {...}
 * @returns {Proposal} Proposal object
 */
app.post('/', daoCheck, siweAuth, permissionsCheck, async (c) => {
  const user = c.get('user');
  if (!user) throw new ApiError('user not found', 401);
  if (!user.permissions?.isProposer) throw new ApiError('User does not have proposer permissions', 403);
  const dao = c.get('dao');
  const {
    title,
    body,
    votingStrategyAddress,
    voteType,
    voteChoices,
    cycle,
  } = await c.req.json() as NewProposal;
  const proposal = await db.insert(schema.proposalTable).values({
    daoChainId: dao.chainId,
    daoAddress: dao.address,
    authorAddress: user.address,
    title,
    body,
    votingStrategyAddress,
    voteType,
    voteChoices,
    cycle,
  }).returning();

  const ret = proposal[0];
  return resf(c, ret);
});

/**
 * @title Get a proposal by slug
 * @route GET /d/{chainId}/{address}/proposals/{slug}
 * @param {string} slug - Slug or id of the proposal
 * @returns {Proposal} Proposal object
 */
app.get('/:slug', daoCheck, async (c) => {
  const dao = c.get('dao');
  const { slug } = c.req.param() as ProposalParams;
  if (!slug) throw new ApiError('Proposal slug or id is required', 400);
  const slugIsNumber = !Number.isNaN(Number(slug));
  const slugOrId = slugIsNumber ?
    eq(schema.proposalTable.id, Number(slug)) :
    eq(schema.proposalTable.slug, slug);

  const proposal = await db.query.proposalTable.findFirst({
    where: and(
      slugOrId,
      eq(schema.proposalTable.daoChainId, dao.chainId),
      eq(schema.proposalTable.daoAddress, dao.address)
    ),
  });

  if (!proposal) throw new ApiError('Proposal not found', 404);

  return resf(c, proposal);
});

/**
 * @title Update a proposal
 * @route PUT /d/{chainId}/{address}/proposals/{slug}
 * @body {...}
 * @returns {Proposal} Proposal object
 */
app.put('/:slug', daoCheck, siweAuth, permissionsCheck, async (c) => {
  const { slug } = c.req.param() as ProposalParams;
  if (!slug) throw new ApiError('Proposal slug is required', 400);
  const user = c.get('user');
  if (!user) throw new ApiError('user not found', 401);
  if (!user.permissions?.isProposer) throw new ApiError('User does not have proposer permissions', 403);
  const {
    title,
    body,
    voteType,
    voteChoices,
    cycle,
  } = await c.req.json() as UpdateProposal;
  const proposal = await db.update(schema.proposalTable).set({
    title,
    body,
    voteType,
    voteChoices,
    cycle,
  }).where(eq(schema.proposalTable.slug, slug));

  return resf(c, proposal);
});

export default app;
