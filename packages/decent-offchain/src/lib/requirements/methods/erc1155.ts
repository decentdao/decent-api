import { Address } from 'viem';
import { SupportedChainId } from 'decent-sdk';
import { CheckResult, ERC1155Requirement } from '../types';
import { getNFTsForOwner } from '@/lib/alchemy';

export async function erc1155Check(
  chainId: SupportedChainId,
  address: Address,
  method: ERC1155Requirement,
): Promise<CheckResult> {
  try {
    const nfts = await getNFTsForOwner(chainId, address, method.tokenAddress);
    const balance = nfts.ownedNfts?.reduce((acc, nft) => acc + parseInt(nft.balance), 0) || 0;

    const eligible = BigInt(balance) >= BigInt(method.amount);

    return {
      eligible,
      ineligibleReason: eligible
        ? undefined
        : `ERC1155 balance of ${method.amount} token from ${method.tokenAddress}, ${address} has ${balance}`,
    };
  } catch (error) {
    return {
      eligible: false,
      ineligibleReason: `Failed to check ERC1155 balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
