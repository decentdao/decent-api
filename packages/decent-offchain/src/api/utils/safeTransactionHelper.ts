import { abis } from '@fractal-framework/fractal-contracts';
import { Address, encodePacked, getContract, Hex, keccak256 } from 'viem';
import { getAverageBlockTime, getBlockTimestamp } from './blockTimestamp';
import { SupportedChainId } from 'decent-sdk';
import { getPublicClient } from './publicClient';

export interface SafeTransactionLike {
  safeNonce: number;
  safeTxHash: Address;
  executedTxHash: Address | null;
  confirmationsRequired?: number;
  confirmations?: unknown[];
}

export const isRejected = (
  transactionArr: SafeTransactionLike[],
  transaction: SafeTransactionLike,
) => {
  return transactionArr.find(transactionInArray => {
    return (
      transactionInArray.safeNonce === transaction.safeNonce &&
      transactionInArray.safeTxHash !== transaction.safeTxHash &&
      transactionInArray.executedTxHash !== null
    );
  });
};

export const isApproved = (transaction: SafeTransactionLike) => {
  return (transaction.confirmations?.length || 0) >= (transaction?.confirmationsRequired || 1);
};

export async function getTxTimelockedTimestamp(
  signatures: Hex,
  freezeGuardAddress: Address,
  chainId: SupportedChainId,
) {
  const publicClient = getPublicClient(chainId);
  const signaturesHash = keccak256(encodePacked(['bytes'], [signatures]));

  const freezeGuard = getContract({
    address: freezeGuardAddress,
    abi: abis.MultisigFreezeGuard,
    client: publicClient,
  });

  const timelockedTimestamp = await getBlockTimestamp(
    await freezeGuard.read.getTransactionTimelockedBlock([signaturesHash]),
    chainId,
  );
  return timelockedTimestamp;
}

export async function getFreezeGuardData(
  freezeGuardAddress: Address | undefined,
  chainId: SupportedChainId,
) {
  if (!freezeGuardAddress) {
    return undefined;
  }

  const publicClient = getPublicClient(chainId);
  const blockNumber = await publicClient.getBlockNumber();
  const currentTimetamp = await getBlockTimestamp(Number(blockNumber), chainId);
  const averageBlockTime = await getAverageBlockTime(chainId);
  const freezeGuard = getContract({
    address: freezeGuardAddress,
    abi: abis.MultisigFreezeGuard,
    client: publicClient,
  });

  const [timelockPeriod, executionPeriod] = await Promise.all([
    freezeGuard.read.timelockPeriod(),
    freezeGuard.read.executionPeriod(),
  ]);

  return {
    guardTimelockPeriodMs: BigInt(timelockPeriod) * BigInt(averageBlockTime) * 1000n,
    guardExecutionPeriodMs: BigInt(executionPeriod) * BigInt(averageBlockTime) * 1000n,
    lastBlockTimestamp: currentTimetamp,
  };
}
