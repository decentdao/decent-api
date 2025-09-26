import { Address, erc721Abi } from 'viem';
import { SupportedChainId } from 'decent-sdk';
import { CheckResult, ERC721Requirement } from '../types';
import { getPublicClient } from '@/api/utils/publicClient';

export async function erc721Check(
  chainId: SupportedChainId,
  address: Address,
  method: ERC721Requirement,
): Promise<CheckResult> {
  try {
    const client = getPublicClient(chainId);
    const balance = await client.readContract({
      address: method.tokenAddress,
      abi: erc721Abi,
      functionName: 'balanceOf',
      args: [address],
    });

    const eligible = balance >= BigInt(method.amount);

    return {
      eligible,
      ineligibleReason: eligible
        ? undefined
        : `ERC721 balance of ${method.amount} ${method.tokenAddress}, ${address} has ${balance}`,
    };
  } catch (error) {
    return {
      eligible: false,
      ineligibleReason: `Failed to check ERC721 balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
