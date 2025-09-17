import { Address } from 'viem';
import { SupportedChainId } from 'decent-sdk';
import { CheckResult, ERC1155Verification } from '../types';

export function erc1155Check(
  chainId: SupportedChainId,
  address: Address,
  method: ERC1155Verification,
): CheckResult {
  // TODO: Implement ERC1155 balance check
  // 1. Get ERC1155 contract instance using viem
  // 2. Call balanceOf(address, tokenId)
  // 3. Compare with method.amount using method.operator
  return {
    eligible: false,
    reason: `Need ${method.amount} of token ${method.tokenId} from ${method.contract}`,
  };
}
