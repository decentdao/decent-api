import { Hono } from "hono";
import { Address } from "viem";
import { db } from "@/db";
import { schema } from "@/db/schema";
import resf, { ApiError } from "@/api/utils/responseFormatter";
import { eq, and } from "drizzle-orm";
import { siweAuth } from "@/api/middleware/auth";

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
app.get("/", async (c) => {
  const { chainId, address } = c.req.param() as ProposalParams;
  const chainIdNumber = Number(chainId);
  const addressLower = address.toLowerCase() as Address;
  const proposals = await db.query.proposalTable.findMany({
    where: and(
      eq(schema.proposalTable.daoChainId, chainIdNumber),
      eq(schema.proposalTable.daoAddress, addressLower)
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
app.post("/", siweAuth, async (c) => {
  const { chainId, address } = c.req.param() as ProposalParams;
  const chainIdNumber = Number(chainId);
  const addressLower = address.toLowerCase() as Address;
  const { title, body } = await c.req.json();
  const user = c.get("user");
  if (!user) throw new ApiError("user not found", 401);
  const proposal = await db.insert(schema.proposalTable).values({
    daoChainId: chainIdNumber,
    daoAddress: addressLower,
    authorAddress: user.address,
    title,
    body,
  });
  return resf(c, proposal);
});

/**
 * @title Get a proposal by slug
 * @route GET /d/{chainId}/{address}/proposals/{slug}
 * @param {string} slug - Slug or id of the proposal
 * @returns {Proposal} Proposal object
 */
app.get("/:slug", async (c) => {
  const { chainId, address, slug } = c.req.param() as ProposalParams;
  const chainIdNumber = Number(chainId);
  const addressLower = address.toLowerCase() as Address;
  if (!slug) throw new ApiError("Proposal slug or id is required", 400);
  const slugIsNumber = !Number.isNaN(Number(slug));
  const slugOrId = slugIsNumber ?
    eq(schema.proposalTable.id, Number(slug)) :
    eq(schema.proposalTable.slug, slug);

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

/**
 * @title Update a proposal
 * @route PUT /d/{chainId}/{address}/proposals/{slug}
 * @body {...}
 * @returns {Proposal} Proposal object
 */
app.put("/:slug", siweAuth, async (c) => {
  const { slug } = c.req.param() as ProposalParams;
  if (!slug) throw new ApiError("Proposal slug is required", 400);
  const { title, body } = await c.req.json();
  const user = c.get("user");
  if (!user) throw new ApiError("user not found", 401);
  const proposal = await db.update(schema.proposalTable).set({
    title,
    body,
  }).where(eq(schema.proposalTable.slug, slug));

  return resf(c, proposal);
});

export default app;
 