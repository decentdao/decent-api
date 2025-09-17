import { Address } from 'viem';
import { SupportedChainId } from 'decent-sdk';
import { CheckResult, ERC20Verification } from '../types';

export function erc20Check(
  chainId: SupportedChainId,
  address: Address,
  method: ERC20Verification,
): CheckResult {
  // TODO: Implement ERC20 balance check
  // 1. Get ERC20 contract instance using viem
  // 2. Call balanceOf(address)
  // 3. Compare with method.amount using method.operator
  return {
    eligible: false,
    reason: `Need ${method.amount} ${method.contract} tokens`,
  };
}
