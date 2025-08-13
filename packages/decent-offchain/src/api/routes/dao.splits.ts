import { Hono } from 'hono';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { splitWalletTable } from '@/db/schema/onchain';
import { daoCheck } from '@/api/middleware/dao';
import resf, { ApiError } from '@/api/utils/responseFormatter';

const app = new Hono();

/**
 * @title Get split wallets for a DAO
 * @route GET /d/{chainId}/{address}/splits
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @returns {SplitWallet[]} Array of split wallet objects
 */
app.get('/', daoCheck, async c => {
  const dao = c.get('dao');

  const splitWallets = await db
    .select({
      name: splitWalletTable.name,
      address: splitWalletTable.address,
      splits: splitWalletTable.splits,
    })
    .from(splitWalletTable)
    .where(
      and(
        eq(splitWalletTable.daoAddress, dao.address),
        eq(splitWalletTable.daoChainId, dao.chainId),
      ),
    );

  if (splitWallets.length === 0) throw new ApiError('No split wallets for DAO', 404);

  return resf(c, splitWallets);
});

export default app;
