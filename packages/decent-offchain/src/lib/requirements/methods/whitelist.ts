import { Address } from 'viem';
import { CheckResult, WhitelistRequirement } from '../types';

export function whitelistCheck(address: Address, method: WhitelistRequirement): CheckResult {
  const passes = method.addresses.includes(address);
  return {
    eligible: passes,
    ineligibleReason: passes ? undefined : `Address ${address} not on whitelist`,
  };
}
