import { Hono } from 'hono';
import { db } from '@/db';
import resf, { ApiError } from '@/api/utils/responseFormatter';
import { DEFAULT_DAO_WITH } from '@/db/queries';
import { bearerAuth } from '@/api/middleware/auth';
import { daoCheck } from '@/api/middleware/dao';
import { DbDao } from '@/db/schema/onchain';
import { formatDao } from '@/api/utils/typeConverter';
import { permissionsCheck } from '@/api/middleware/permissions';
import { getChainId } from '@/api/utils/chains';
import { getExecutedSafeTransactions } from '@/lib/safe';
import { DbNewSafeProposal, schema } from '@/db/schema';

const app = new Hono();

/**
 * @title Get all DAOs
 * @route GET /d
 * @param {string} [name] - Optional name query parameter
 * @returns {Dao[]} Array of DAO objects
 */
app.get('/', async c => {
  const nameQueryParam = c.req.query('name');
  const query = (await db.query.daoTable.findMany({
    where: (dao, { ilike }) =>
      nameQueryParam ? ilike(dao.name, `%${nameQueryParam}%`) : undefined,
    with: DEFAULT_DAO_WITH,
  })) as DbDao[];
  const daos = query.map(formatDao);
  return resf(c, daos);
});

/**
 * @title Get all DAOs for a specific chain
 * @route GET /d/{chainId}
 * @param {string} chainId - Chain ID parameter
 * @returns {Dao[]} Array of DAO objects
 */
app.get('/:chainId', async c => {
  const { chainId } = c.req.param();
  const chainIdNumber = getChainId(chainId);
  const query = (await db.query.daoTable.findMany({
    where: (dao, { eq }) => eq(dao.chainId, chainIdNumber),
    with: DEFAULT_DAO_WITH,
  })) as DbDao[];

  const daos = query.map(formatDao);

  return resf(c, daos);
});

/**
 * @title Get a DAO by chain ID and address
 * @route GET /d/{chainId}/{address}
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @returns {Dao} DAO object
 */
app.get('/:chainId/:address', daoCheck, async c => {
  const dao = c.get('dao');
  return resf(c, dao);
});

/**
 * @title Get all Safe proposals for a DAO
 * @route GET /d/{chainId}/{address}/safe-proposals
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @returns {SafeProposal[]} Array of Safe proposal objects
 */
app.get('/:chainId/:address/safe-proposals', daoCheck, async c => {
  const dao = c.get('dao');
  if (dao.governanceModules?.length !== 0) throw new ApiError('DAO is not a Safe DAO', 400);

  const transactions = await getExecutedSafeTransactions(dao.chainId, dao.address);
  const proposals: DbNewSafeProposal[] = [];
  transactions.results.forEach(t => {
    const proposer = (t.proposer || t.confirmations?.[0]?.owner) as `0x${string}`;
    proposals.push({
      daoChainId: dao.chainId,
      daoAddress: dao.address,
      proposer,
      safeNonce: t.nonce,
      transactions: t.dataDecoded,
    });
  });
  await db.insert(schema.safeProposalTable).values(proposals);
  return resf(c, 'ok');
});

/**
 * @title Get my permissions for a DAO
 * @route GET /d/{chainId}/{address}/me
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @returns {User} User object
 */
app.get('/:chainId/:address/me', daoCheck, bearerAuth, permissionsCheck, async c => {
  const user = c.get('user');
  if (!user) throw new ApiError('User not found', 401);
  return resf(c, user);
});

export default app;
