import { Address } from 'viem';
import { CheckResult, KycVerification } from '../types';

export function kycCheck(
  address: Address,
  method: KycVerification,
): CheckResult {
  // TODO: Implement KYC status check
  // 1. Check database for existing KYC approval for this address
  // 2. If approved, return eligible: true
  // 3. If not approved, generate Sumsub KYC URL and return it
  const kycUrl = `https://cockpit.sumsub.com/idensic/l/#/uni_${address}_${Date.now()}`;

  return {
    eligible: false,
    reason: `KYC verification required: ${method.provider} level ${method.levelName}`,
    kycUrl,
  };
}
