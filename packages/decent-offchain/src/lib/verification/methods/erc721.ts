import { Address } from 'viem';
import { SupportedChainId } from 'decent-sdk';
import { CheckResult, ERC721Verification } from '../types';

export function erc721Check(
  chainId: SupportedChainId,
  address: Address,
  method: ERC721Verification,
): CheckResult {
  // TODO: Implement ERC721 balance check
  // 1. Get ERC721 contract instance using viem
  // 2. Call balanceOf(address)
  // 3. Compare with method.amount using method.operator
  // 4. If tokenId specified, check ownership of specific token
  return {
    eligible: false,
    reason: `Need ${method.amount} NFTs from ${method.contract}`,
  };
}
