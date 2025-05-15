import { Hono } from 'hono';
import { Health, Meta, SupportedChainId } from 'decent-sdk';
import { count } from 'drizzle-orm';
import resf, { ApiError } from '@/api/utils/responseFormatter';
import { db } from '@/db';
import { daoTable } from '@/db/schema/onchain';

const app = new Hono();

/**
 * @title Get API metadata
 * @route GET /
 * @returns {Meta} API metadata
 */
app.get('/', c => {
  const version = process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) || 'local';
  const meta: Meta = {
    name: 'decent-offchain',
    version,
  };
  return resf(c, meta);
});

/**
 * @title Get API health status
 * @route GET /health
 * @returns {Health} Health status
 */
app.get('/health', c => {
  const status: Health = 'ok';
  return resf(c, status);
});

/**
 * @title Get all chains with DAOs
 * @route GET /chains
 * @returns {SupportedChainId[]} Array of chain IDs
 */
app.get('/chains', async c => {
  const chainIds = await db.selectDistinct({ chainId: daoTable.chainId }).from(daoTable);
  const chains: SupportedChainId[] = chainIds.map(chain => chain.chainId).sort((a, b) => a - b);
  return resf(c, chains);
});

/**
 * @title Get platform stats
 * @route GET /stats
 * @returns Platform stats
 */
app.get('/stats', async c => {
  const query = {
    daos: await db.select({ count: count() }).from(daoTable),
  };

  if (!query.daos.length || !query.daos[0]) throw new ApiError('Failed to get daos', 500);
  const daoCount = query.daos.length ? query.daos[0].count : 0;

  return resf(c, { daoCount });
});
export default app;
