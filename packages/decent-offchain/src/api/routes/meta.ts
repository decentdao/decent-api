import { Hono } from 'hono';
import resf from '@/api/utils/responseFormatter';
import { db } from '@/db';
import { daoTable } from '@/db/schema/onchain';

const app = new Hono();

/**
 * @title Get API metadata
 * @route GET /
 * @returns {Meta} API metadata
 */
app.get('/', (c) => {
  const version = process.env.RAILWAY_GIT_COMMIT_SHA || 'local';
  const info = {
    name: 'decent-offchain',
    version,
  };
  return resf(c, info);
});

/**
 * @title Get API health status
 * @route GET /health
 * @returns {string} Health status
 */
app.get('/health', (c) => {
  const status = 'ok'
  return resf(c, status);
});

/**
 * @title Get all chains with DAOs
 * @route GET /chains
 * @returns {string[]} Array of chain IDs
 */
app.get('/chains', async (c) => {
  const chainIds = await db
    .selectDistinct({ chainId: daoTable.chainId })
    .from(daoTable);
  const chains = chainIds.map((chain) => chain.chainId);
  return resf(c, chains);
});

export default app;
