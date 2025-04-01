import { Hono } from "hono";
import { db } from "@/db";
import resf, { ApiError } from "@/api/utils/responseFormatter";
import { DEFAULT_DAO_WITH } from "@/db/queries";
import proposals from "@/api/routes/dao.proposals";

const app = new Hono();

/**
 * Get all DAOs
 * @route GET /d
 * @returns {Dao[]} Array of DAO objects
 */
app.get("/", async (c) => {
  const query = await db.query.daoTable.findMany();
  return resf(c, query);
});

/**
 * Get all DAOs for a specific chain
 * @route GET /d/{chainId}
 * @param {string} chainId - Chain ID parameter
 * @returns {Dao[]} Array of DAO objects
 */
app.get("/:chainId", async (c) => {
  const { chainId } = c.req.param();
  const chainIdNumber = Number(chainId);
  const query = await db.query.daoTable.findMany({
    where: (dao, { eq }) => eq(dao.chainId, chainIdNumber),
    with: DEFAULT_DAO_WITH,
  });
  return resf(c, query);
});

/**
 * Get a DAO by chain ID and address
 * @route GET /d/{chainId}/{address}
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @returns {Dao} DAO object
 */
app.get("/:chainId/:address", async (c) => {
  const { chainId, address } = c.req.param();
  const chainIdNumber = Number(chainId);
  const addressLower = address.toLowerCase() as `0x${string}`;
  const query = await db.query.daoTable.findFirst({
    where: (dao, { eq }) => eq(dao.chainId, chainIdNumber) && eq(dao.address, addressLower),
    with: DEFAULT_DAO_WITH,
  });
  
  if (!query) throw new ApiError("DAO not found", 404);
  
  return resf(c, query);
});

/**
 * @dev see ./dao.proposals for implementation
 */
app.route("/:chainId/:address/proposals", proposals);

export default app;
