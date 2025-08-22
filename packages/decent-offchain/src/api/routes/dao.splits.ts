import { Hono } from 'hono';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { splitWalletTable } from '@/db/schema/onchain';
import { daoCheck } from '@/api/middleware/dao';
import resf, { ApiError } from '@/api/utils/responseFormatter';
import { duneFetchBalances } from '@/lib/dune';

const app = new Hono();

const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

// splitsV2 leaves some a small amount of wei in the contract
// frontend depends on this to determine whether user should distribute or not
const MINIMUM_BALANCE_WEI = 100n;

/**
 * @title Get split wallets for a DAO
 * @route GET /d/{chainId}/{address}/splits
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @returns
 *  {
 *    name: string | null;
 *    address: `0x${string}`;
 *    splits: Split[];
 *    tokens: Address[]
 *  }[]
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

  const splitWalletsWithTokenHoldings = await Promise.all(
    splitWallets.map(async wallet => {
      const { balances } = await duneFetchBalances(wallet.address, {
        chainIds: String(dao.chainId),
        excludeSpamTokens: true,
        metadata: false,
      });

      const tokens = balances
        .filter(b => BigInt(b.amount) > MINIMUM_BALANCE_WEI)
        .map(b => {
          if (b.address === 'native') return NATIVE_TOKEN_ADDRESS; // Dune returns as 'native' but we like to use NATIVE_TOKEN_ADDRESS
          return b.address;
        });

      return {
        ...wallet,
        tokens,
      };
    }),
  );

  return resf(c, splitWalletsWithTokenHoldings);
});

export default app;
