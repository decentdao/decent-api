import { Address } from 'viem';
import { eq } from 'drizzle-orm';
import { CheckResult, KYCRequirement } from '../types';
import { kycTable } from '@/db/schema/offchain/kyc';
import { db } from '@/db';
import { generateWebSdkLink } from '@/lib/sumsub';

export async function kycCheck(address: Address, method: KYCRequirement): Promise<CheckResult> {
  const { isKycApproved } = (await db.query.kycTable.findFirst({
    where: eq(kycTable.address, address),
  })) || { isKycApproved: false };

  if (isKycApproved) {
    return {
      eligible: true,
    };
  }

  const newKyc = await db.insert(kycTable).values({
    address
  }).returning();
  const id = newKyc[0]?.id;
  if (!id) throw new Error('DB error creating applicant');

  const kycUrl = await generateWebSdkLink(id);

  return {
    eligible: false,
    reason: `KYC verification required: ${method.provider} level ${method.levelName}`,
    kycUrl,
  };
}
