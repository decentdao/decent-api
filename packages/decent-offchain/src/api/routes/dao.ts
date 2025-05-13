import { Hono } from 'hono';
import { db } from '@/db';
import resf, { ApiError } from '@/api/utils/responseFormatter';
import { DEFAULT_DAO_WITH } from '@/db/queries';
import { beaerAuth } from '@/api/middleware/auth';
import { daoCheck } from '@/api/middleware/dao';
import { DbDao } from '@/db/schema/onchain';
import { formatDao } from '@/api/utils/typeConverter';
import { permissionsCheck } from '@/api/middleware/permissions';
import { getChainId } from '@/api/utils/chains';

const app = new Hono();

/**
 * @title Get all DAOs
 * @route GET /d
 * @returns {Dao[]} Array of DAO objects
 */
app.get('/', async c => {
  const query = (await db.query.daoTable.findMany({
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
 * @title Get my permissions for a DAO
 * @route GET /d/{chainId}/{address}/me
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @returns {User} User object
 */
app.get('/:chainId/:address/me', daoCheck, beaerAuth, permissionsCheck, async c => {
  const user = c.get('user');
  if (!user) throw new ApiError('User not found', 401);
  return resf(c, user);
});

export default app;
