import { eq, and } from 'drizzle-orm';
import { SupportedChainId } from 'decent-sdk';
import { getPublicClient } from './publicClient';
import { unixTimestamp } from './time';
import { db } from '@/db';
import { DbProposal, schema } from '@/db/schema';

const avgBlockTimeCache = new Map<number, { blockTime: number; updatedAt: number }>();
const CACHE_DURATION = 24 * 60 * 60;

export const getAverageBlockTime = async (chainId: SupportedChainId): Promise<number> => {
  const cached = avgBlockTimeCache.get(chainId);
  const now = unixTimestamp();

  if (cached && now < cached.updatedAt + CACHE_DURATION) {
    return cached.blockTime;
  }

  const client = getPublicClient(chainId);

  try {
    const latestBlock = await client.getBlock();
    const pastBlock = await client.getBlock({ blockNumber: latestBlock.number - 1000n });
    const averageBlockTime = Number(latestBlock.timestamp - pastBlock.timestamp) / 1000;
    avgBlockTimeCache.set(chainId, { blockTime: averageBlockTime, updatedAt: now });

    return averageBlockTime;
  } catch (error) {
    console.error(`Failed to get average block time for chain ${chainId}:`, error);
    // Return fallback values
    const fallbackTimes: Record<SupportedChainId, number> = {
      1: 12, // Ethereum mainnet
      8453: 2, // Base
      10: 2, // Optimism
      137: 2, // Polygon
      11155111: 12, // Sepolia
    };
    return fallbackTimes[chainId];
  }
};

export const getBlockTimestamp = async (
  blockNumber: number,
  chainId: SupportedChainId,
): Promise<number> => {
  const client = getPublicClient(chainId);

  try {
    const latestBlock = await client.getBlock();

    if (blockNumber < latestBlock.number) {
      // Block is in the past, get actual timestamp
      const block = await client.getBlock({ blockNumber: BigInt(blockNumber) });
      return Number(block.timestamp);
    } else {
      // Block is in the future, estimate timestamp
      const averageBlockTime = await getAverageBlockTime(chainId);
      const estimatedTimestamp = Number(latestBlock.timestamp) +
        (averageBlockTime * (blockNumber - Number(latestBlock.number)));
      return Math.floor(estimatedTimestamp);
    }
  } catch (error) {
    console.error(
      `Failed to get block timestamp for block ${blockNumber} on chain ${chainId}:`,
      error,
    );
    return 0;
  }
};

export const useCacheBlockTimestamp = async (
  chainId: SupportedChainId,
  blockNumber: number,
): Promise<number> => {
  // Try database first, then fetch and cache if missing
  const cached = await db.query.blockTimestampTable.findFirst({
    where: and(
      eq(schema.blockTimestampTable.chainId, chainId),
      eq(schema.blockTimestampTable.blockNumber, blockNumber)
    )
  });

  const now = unixTimestamp();
  if (cached?.timestamp && now < cached.updatedAt + CACHE_DURATION) {
    return cached.timestamp;
  }

  // Fetch, cache, and return
  const timestamp = await getBlockTimestamp(blockNumber, chainId);
  const client = getPublicClient(chainId);
  const latestBlock = await client.getBlock();
  const future = blockNumber > Number(latestBlock.number);
  await db
    .insert(schema.blockTimestampTable)
    .values({
      chainId,
      blockNumber,
      timestamp,
      future,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: [schema.blockTimestampTable.chainId, schema.blockTimestampTable.blockNumber],
      set: {
        future,
        timestamp,
        updatedAt: now,
      },
    });

  return timestamp;
};

export const addProposalTimestamp = async (proposal: DbProposal, chainId: SupportedChainId) => {
  if (!proposal.blockTimestamp?.timestamp && proposal.votingEndBlock) {
    proposal.blockTimestamp = {
      timestamp: await useCacheBlockTimestamp(chainId, proposal.votingEndBlock)
    };
  }
  return proposal;
};
