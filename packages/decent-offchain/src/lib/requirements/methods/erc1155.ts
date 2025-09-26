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
      args: [address, BigInt(method.tokenId)],
    });

    const eligible = balance >= BigInt(method.amount);

    return {
      eligible,
      ineligibleReason: eligible
        ? undefined
        : `ERC1155 balance of ${method.amount} token ${method.tokenId} from ${method.tokenAddress}, ${address} has ${balance}`,
    };
  } catch (error) {
    return {
      eligible: false,
      ineligibleReason: `Failed to check ERC1155 balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
