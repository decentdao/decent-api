import { Address } from 'viem';
import { SupportedChainId } from 'decent-sdk';
import { CheckResult, ERC1155Requirement } from '../types';
import { getPublicClient } from '../../../api/utils/publicClient';

const ERC1155_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export async function erc1155Check(
  chainId: SupportedChainId,
  address: Address,
  method: ERC1155Requirement,
): Promise<CheckResult> {
  try {
    const client = getPublicClient(chainId);
    const balance = await client.readContract({
      address: method.tokenAddress,
      abi: ERC1155_ABI,
      functionName: 'balanceOf',
      args: [address, method.tokenId],
    });

    const eligible = balance >= method.amount;

    return {
      eligible,
      reason: eligible
        ? undefined
        : `Need ${method.amount} of token ${method.tokenId}, have ${balance}`,
    };
  } catch (error) {
    return {
      eligible: false,
      reason: `Failed to check ERC1155 balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
