import { Hono } from 'hono';
import { Address, isAddress } from 'viem';
import { db } from '@/db';
import resf, { ApiError } from '@/api/utils/responseFormatter';
import { eq, and, or } from 'drizzle-orm';
import {
  daoTable,
  votingTokenTable,
  votingStrategyTable,
  governanceModuleTable,
} from '@/db/schema/onchain';
import { getChainId } from '@/api/utils/chains';

const app = new Hono();

/**
 * @title Get DAOs that use specified token
 * @route GET /t/:chaindId/:tokenAddress
 * @returns {
 *  {
 *    name: string,
 *    address: string,
 *    tokenType: 'ERC20' | 'ERC721'
 *  }[]
 * } Array of simple DAO objects with token type
 */
app.get('/:chainId/:tokenAddress', async c => {
  const { chainId, tokenAddress } = c.req.param();
  const tokenQuery = tokenAddress?.toLowerCase() as Address;
  if (!isAddress(tokenQuery)) throw new ApiError('Invalid token address', 400);
  const chainIdNumber = getChainId(chainId);

  const daos = await db
    .selectDistinct({
      name: daoTable.name,
      address: daoTable.address,
    })
    .from(daoTable)
    .leftJoin(
      governanceModuleTable,
      and(
        eq(governanceModuleTable.daoChainId, daoTable.chainId),
        eq(governanceModuleTable.daoAddress, daoTable.address)
      )
    )
    .leftJoin(
      votingStrategyTable,
      eq(votingStrategyTable.governanceModuleId, governanceModuleTable.address)
    )
    .leftJoin(
      votingTokenTable,
      eq(votingTokenTable.votingStrategyId, votingStrategyTable.address)
    )
    .where(
      and(
        eq(daoTable.chainId, chainIdNumber),
        or(
          eq(daoTable.erc20Address, tokenQuery),
          eq(votingTokenTable.address, tokenQuery)
        )
      )
    );

  return resf(c, daos);
});

export default app;
