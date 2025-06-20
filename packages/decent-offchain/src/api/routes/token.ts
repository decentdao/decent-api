import { Hono } from 'hono';
import { Address, isAddress } from 'viem';
import { SUPPORTED_CHAIN_IDS } from 'decent-sdk';
import { eq, and, or, sql, inArray } from 'drizzle-orm';
import { db } from '@/db';
import resf, { ApiError } from '@/api/utils/responseFormatter';
import {
  daoTable,
  votingTokenTable,
  votingStrategyTable,
  governanceModuleTable,
} from '@/db/schema/onchain';
import { duneFetchBalances, duneFetchTransactions, duneFetchToken } from '@/lib/dune';
import { LogEntry } from '@/lib/dune/types';

const app = new Hono();

const TRANSFER_TOPIC = '0xddf252ad';
const STAKE_METHOD_ID = '0xa694fc3a';

function getStakedTokenPair(logs: LogEntry[], userAddress: Address): [Address, Address] | null {
  const token = logs.find(
    log =>
      log.topics?.[0]?.startsWith(TRANSFER_TOPIC) &&
      log.topics?.[1]?.slice(-40) === userAddress.slice(2),
  );

  const stakedToken = logs.find(
    log =>
      log.topics?.[0]?.startsWith(TRANSFER_TOPIC) &&
      log.topics?.[2]?.slice(-40) === userAddress.slice(2),
  );

  if (!token || !stakedToken) return null;

  return [token.address, stakedToken.address];
}

/**
 * @title Get DAOs that use specified token
 * @route GET /t/:walletAddress
 * @returns
 *  {
 *    chainId: number,
 *    address: string,
 *    name: string,
 *    token: {
 *      address: string,
 *      symbol: string,
 *      name: string,
 *      balance: string,
 *      decimals: number,
 *      logo: string
 *    },
 *    stakedToken?: {
 *      address: string,
 *      symbol: string,
 *      name: string,
 *      balance: string,
 *      decimals: number,
 *      logo: string
 *    }
 *  }[]
 */
app.get('/:walletAddress', async c => {
  const { walletAddress } = c.req.param();
  const walletQuery = walletAddress?.toLowerCase() as Address;
  if (!isAddress(walletQuery)) throw new ApiError('Invalid wallet address', 400);

  const { balances } = await duneFetchBalances(walletQuery, {
    chainIds: SUPPORTED_CHAIN_IDS.join(','),
    metadata: true,
  });

  // Filter out tokens that have a space in the symbol, these are spam
  const filteredTokens = balances.filter(token => !token.symbol?.includes(' '));

  const dbSearchTokenSet = new Set(
    filteredTokens.map(token => token.address.toLowerCase() as Address),
  );

  // Get stake transactions for the wallet
  const { transactions } = await duneFetchTransactions(walletQuery, {
    chainIds: SUPPORTED_CHAIN_IDS.join(','),
    method_id: STAKE_METHOD_ID,
  });

  const stakedTokenMap = new Map(
    transactions
      .map(tx => {
        const pair = getStakedTokenPair(tx.logs, walletQuery);
        if (pair) dbSearchTokenSet.add(pair[0]);
        return pair;
      })
      .filter(pair => pair !== null),
  );

  const daos = await db
    .selectDistinct({
      name: daoTable.name,
      address: daoTable.address,
      chainId: daoTable.chainId,
      tokenAddress: sql<string>`
        CASE 
          WHEN ${daoTable.erc20Address} IS NOT NULL THEN ${daoTable.erc20Address}
          ELSE ${votingTokenTable.address}
        END
      `.as('tokenAddress')
    })
    .from(daoTable)
    .leftJoin(
      governanceModuleTable,
      and(
        eq(governanceModuleTable.daoChainId, daoTable.chainId),
        eq(governanceModuleTable.daoAddress, daoTable.address),
      ),
    )
    .leftJoin(
      votingStrategyTable,
      eq(votingStrategyTable.governanceModuleId, governanceModuleTable.address),
    )
    .leftJoin(votingTokenTable, eq(votingTokenTable.votingStrategyId, votingStrategyTable.address))
    .where(
      or(
        inArray(daoTable.erc20Address, Array.from(dbSearchTokenSet)),
        inArray(votingTokenTable.address, Array.from(dbSearchTokenSet)),
      ),
    );

  const tokenMap = new Map(
    filteredTokens.map(token => [token.address.toLowerCase() as Address, token]),
  );

  const daosWithTokens = await Promise.all(daos.map(async d => {
    let tokenInfo = tokenMap.get(d.tokenAddress as Address);
    if (!tokenInfo) {
      const fetchedTokenInfo = await duneFetchToken(d.chainId, d.tokenAddress as Address);
      tokenInfo = fetchedTokenInfo.tokens[0];
    }
    const stakedTokenInfo = tokenMap.get(stakedTokenMap.get(d.tokenAddress as Address) as Address)

    const ret = {
      name: d.name,
      chainId: d.chainId,
      address: d.address,
      token: {
        address: tokenInfo?.address,
        symbol: tokenInfo?.symbol,
        name: tokenInfo?.name,
        balance: tokenInfo?.amount || '0',
        decimals: tokenInfo?.decimals,
        logo: tokenInfo?.token_metadata?.logo,
      },
      stakedToken: stakedTokenInfo ? {
        address: stakedTokenInfo.address,
        symbol: stakedTokenInfo.symbol,
        name: stakedTokenInfo.name,
        balance: stakedTokenInfo.amount,
        decimals: stakedTokenInfo.decimals,
        logo: stakedTokenInfo.token_metadata?.logo,
      } : undefined,
    };
    return ret;
  }));

  return resf(c, daosWithTokens);
});

export default app;
