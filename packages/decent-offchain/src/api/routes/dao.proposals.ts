import { Hono } from 'hono';
import { eq, and, isNull } from 'drizzle-orm';
import { NewProposal, UpdateProposal, ProposalParams, Proposal } from 'decent-sdk';
import { db } from '@/db';
import { DbProposal, schema } from '@/db/schema';
import resf, { ApiError } from '@/api/utils/responseFormatter';
import { bearerAuth } from '@/api/middleware/auth';
import { daoCheck } from '@/api/middleware/dao';
import { permissionsCheck } from '@/api/middleware/permissions';
import { formatProposal } from '@/api/utils/typeConverter';
import { WebSocketConnections } from '../ws/connections';
import { Topics } from '../ws/topics';
import { getPublicClient } from "../utils/publicClient";
import { decodeFunctionResult, getContract } from "viem";
import { TokenBalancesParams } from '@duneanalytics/hooks';
import { abis } from "@fractal-framework/fractal-contracts";

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
  const publicClient = getPublicClient(dao.chainId);
  const azoriusAddress = dao.governanceModules?.[0]?.address;
  if (!azoriusAddress) throw new ApiError('Azorius governance module not found', 404);

  const proposalCount = await publicClient.readContract({
    address: azoriusAddress,
    abi: abis.Azorius,
    functionName: 'totalProposalCount',
  });

  const calls = Array.from({ length: proposalCount }, (_, i) => ({
    address: azoriusAddress,
    abi: abis.Azorius,
    functionName: 'getProposal' as const,
    args: [i],
  }));

  const multicall = await publicClient.multicall({
    contracts: calls,
    allowFailure: false,
  });

  const proposals = multicall.map(p => ({
    strategy: p[0],
    txHashes: p[1],
    timelockPeriod: p[2],
    executionPeriod: p[3],
    executionCounter: p[4],
  }));

  console.log(proposals);

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
        isNull(schema.proposalTable.proposedTxnHash), // only proposals that have not been put onchain can be updated
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
