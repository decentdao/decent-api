import { Hono } from "hono";
import { db } from "@/db";
import { schema } from "@/db/schema";
import resf, { ApiError } from "@/api/utils/responseFormatter";
import { eq, and } from "drizzle-orm";

const app = new Hono();

type ProposalParams = {
  chainId: string;
  address: string;
  slug?: string;
}

/**
 * Get all proposals for a DAO
 * @route GET /d/{chainId}/{address}/proposals
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @returns {Proposal[]} Array of proposal objects
 */
app.get("/", async (c) => {
  const { chainId, address } = c.req.param() as ProposalParams;
  const chainIdNumber = Number(chainId);
  const addressLower = address.toLowerCase() as `0x${string}`;
  const proposals = await db.query.proposalTable.findMany({
    where: and(
      eq(schema.proposalTable.daoChainId, chainIdNumber),
      eq(schema.proposalTable.daoAddress, addressLower)
    )
  });

  return resf(c, proposals);
});

/**
 * Create a proposal
 * @route POST /d/{chainId}/{address}/proposals
 * @body {...}
 * @returns {Proposal} Proposal object
 */
app.post("/", async (c) => {
  const { chainId, address } = c.req.param() as ProposalParams;
  const { title, body, authorAddress } = await c.req.json();
  const proposal = await db.insert(schema.proposalTable).values({
    daoChainId: Number(chainId),
    daoAddress: address.toLowerCase() as `0x${string}`,
    authorAddress: authorAddress.toLowerCase() as `0x${string}`,
    title,
    body,
  });
  return resf(c, proposal);
});

/**
 * Get a proposal by slug
 * @route GET /d/{chainId}/{address}/proposals/{slug}
 * @param {string} slug - Slug or id of the proposal
 * @returns {Proposal} Proposal object
 */
app.get("/:slug", async (c) => {
  const { chainId, address, slug } = c.req.param() as ProposalParams;
  if (!slug) throw new ApiError("Proposal slug or id is required", 400);
  const slugIsNumber = !Number.isNaN(Number(slug));
  const slugOrId = slugIsNumber ?
    eq(schema.proposalTable.id, Number(slug)) :
    eq(schema.proposalTable.slug, slug);
  const chainIdNumber = Number(chainId);
  const addressLower = address.toLowerCase() as `0x${string}`;
  const proposal = await db.query.proposalTable.findFirst({
    where: and(
      slugOrId,
      eq(schema.proposalTable.daoChainId, chainIdNumber),
      eq(schema.proposalTable.daoAddress, addressLower)
    ),
  });

  if (!proposal) throw new ApiError("Proposal not found", 404);

  return resf(c, proposal);
});

export default app;
 