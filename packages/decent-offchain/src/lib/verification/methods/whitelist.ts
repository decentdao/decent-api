import { Address } from 'viem';
import { CheckResult, WhitelistVerification } from '../types';

export function whitelistCheck(
  address: Address,
  method: WhitelistVerification
): CheckResult {
  const passes = method.allowedAddresses.includes(address);
  return {
    eligible: passes,
    reason: passes ? undefined : 'Not on whitelist',
  };
}
