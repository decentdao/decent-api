import { Hono } from 'hono';
import { daoExists } from '@/api/middleware/dao';
import resf from '@/api/utils/responseFormatter';
import { duneFetchBalances, duneFetchCollectibles } from '@/lib/dune';

const app = new Hono();

/**
 * @title Get token balances and collectibles for a DAO
 * @route GET /d/{chainId}/{address}/balances
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @returns {object} Object containing both token balances and collectibles
 */
app.get('/', daoExists, async c => {
  const dao = c.get('basicDaoInfo');

  const queryParams = {
    excludeSpamTokens: true,
    metadata: true,
    chainIds: String(dao.chainId),
  };

  const [balances, collectibles] = await Promise.all([
    duneFetchBalances(dao.address, queryParams),
    duneFetchCollectibles(dao.address, queryParams),
  ]);

  return resf(c, {
    tokens: balances.balances,
    collectibles: collectibles.entries,
  });
});

export default app;
