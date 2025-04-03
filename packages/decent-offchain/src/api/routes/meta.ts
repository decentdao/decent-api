import { Hono } from 'hono';
import resf from '@/api/utils/responseFormatter';
import { db } from '@/db';
import { daoTable } from '@/db/schema/onchain';
import { ChainId, Health, Meta } from '@/api/types';

const app = new Hono();

/**
 * @title Get API metadata
 * @route GET /
 * @returns {Meta} API metadata
 */
app.get('/', (c) => {
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
app.get('/health', (c) => {
  const status: Health = 'ok';
  return resf(c, status);
});

/**
 * @title Get all chains with DAOs
 * @route GET /chains
 * @returns {ChainId[]} Array of chain IDs
 */
app.get('/chains', async (c) => {
  const chainIds = await db
    .selectDistinct({ chainId: daoTable.chainId })
    .from(daoTable);
  const chains: ChainId[] = chainIds.map((chain) => chain.chainId);
  return resf(c, chains);
});

export default app;
