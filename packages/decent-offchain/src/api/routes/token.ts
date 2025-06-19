import { Hono } from 'hono';
import { Address, isAddress } from 'viem';
import { SUPPORTED_CHAIN_IDS } from 'decent-sdk';
import { eq, and, or } from 'drizzle-orm';
import { db } from '@/db';
import resf, { ApiError } from '@/api/utils/responseFormatter';
import {
  daoTable,
  votingTokenTable,
  votingStrategyTable,
  governanceModuleTable,
} from '@/db/schema/onchain';
import { duneFetchBalances } from '@/lib/dune';

const app = new Hono();

/**
 * @title Get DAOs that use specified token
 * @route GET /t/:walletAddress
 * @returns {
 *  {
 *    chainId: number,
 *    address: string,
 *    name: string,
 *    symbol: string,
 *  }[]
 */
app.get('/:walletAddress', async c => {
  const { walletAddress } = c.req.param();
  const walletQuery = walletAddress?.toLowerCase() as Address;
  if (!isAddress(walletQuery)) throw new ApiError('Invalid wallet address', 400);
  const tokens = await duneFetchBalances(walletQuery, {
    chainIds: SUPPORTED_CHAIN_IDS.join(','),
    metadata: true,
  });

  const filteredTokens = tokens.balances.filter(token => !token.symbol?.includes(' '));

  // const daos = await db
  //   .selectDistinct({
  //     name: daoTable.name,
  //     address: daoTable.address,
  //   })
  //   .from(daoTable)
  //   .leftJoin(
  //     governanceModuleTable,
  //     and(
  //       eq(governanceModuleTable.daoChainId, daoTable.chainId),
  //       eq(governanceModuleTable.daoAddress, daoTable.address)
  //     )
  //   )
  //   .leftJoin(
  //     votingStrategyTable,
  //     eq(votingStrategyTable.governanceModuleId, governanceModuleTable.address)
  //   )
  //   .leftJoin(
  //     votingTokenTable,
  //     eq(votingTokenTable.votingStrategyId, votingStrategyTable.address)
  //   )
  //   .where(
  //     and(
  //       eq(daoTable.chainId, chainIdNumber),
  //       or(
  //         eq(daoTable.erc20Address, tokenQuery),
  //         eq(votingTokenTable.address, tokenQuery)
  //       )
  //     )
  //   );

  return resf(c, filteredTokens);
});

export default app;
