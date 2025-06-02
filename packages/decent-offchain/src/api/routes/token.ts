import { Hono } from 'hono';
import { Address } from 'viem';
import { db } from '@/db';
import resf, { ApiError } from '@/api/utils/responseFormatter';
import { eq, and } from 'drizzle-orm';
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
  const chainIdNumber = getChainId(chainId);
  if (!tokenQuery) {
    return resf(c, new ApiError('Token address is required', 400));
  }

  const daoIds = await db
    .selectDistinct({
      name: daoTable.name,
      address: daoTable.address,
      tokenType: votingTokenTable.type,
    })
    .from(daoTable)
    .innerJoin(
      governanceModuleTable,
      and(
        eq(governanceModuleTable.daoChainId, daoTable.chainId),
        eq(governanceModuleTable.daoAddress, daoTable.address)
      )
    )
    .innerJoin(
      votingStrategyTable,
      eq(votingStrategyTable.governanceModuleId, governanceModuleTable.address)
    )
    .innerJoin(
      votingTokenTable,
      eq(votingTokenTable.votingStrategyId, votingStrategyTable.address)
    )
    .where(
      and(
        eq(daoTable.chainId, chainIdNumber),
        eq(votingTokenTable.address, tokenQuery)
      )
    );

  return resf(c, daoIds);
});

export default app;
