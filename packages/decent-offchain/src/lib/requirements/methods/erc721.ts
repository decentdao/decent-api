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

    const eligible = balance >= method.amount;

    return {
      eligible,
      reason: eligible ? undefined : `Need ${method.amount} NFTs, have ${balance}`,
    };
  } catch (error) {
    return {
      eligible: false,
      reason: `Failed to check ERC721 balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
