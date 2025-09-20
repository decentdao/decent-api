import { Address, erc20Abi } from 'viem';
import { SupportedChainId } from 'decent-sdk';
import { CheckResult, ERC20Requirement } from '../types';
import { getPublicClient } from '@/api/utils/publicClient';

export async function erc20Check(
  chainId: SupportedChainId,
  address: Address,
  method: ERC20Requirement,
): Promise<CheckResult> {
  try {
    const client = getPublicClient(chainId);
    const balance = await client.readContract({
      address: method.tokenAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address],
    });

    const eligible = balance >= method.amount;

    return {
      eligible,
      reason: eligible ? undefined : `Need ${method.amount} tokens, have ${balance}`,
    };
  } catch (error) {
    return {
      eligible: false,
      reason: `Failed to check ERC20 balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
