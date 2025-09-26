import { Address } from 'viem';
import { eq } from 'drizzle-orm';
import { CheckResult, KYCRequirement } from '../types';
import { KYCResponseType } from '@/lib/sumsub/types';
import { kycTable } from '@/db/schema/offchain/kyc';
import { db } from '@/db';
import { generateWebSdkLink, generateAccessToken } from '@/lib/sumsub';

export async function kycCheck(
  address: Address,
  method: KYCRequirement,
  kycResponseType: KYCResponseType = 'url',
): Promise<CheckResult> {
  const { isKycApproved } = (await db.query.kycTable.findFirst({
    where: eq(kycTable.address, address),
  })) || { isKycApproved: false };

  if (isKycApproved) {
    return {
      eligible: true,
    };
  }

  const newKyc = await db
    .insert(kycTable)
    .values({
      address,
    })
    .returning();
  const id = newKyc[0]?.id;
  if (!id) throw new Error('DB error creating applicant');

  const kyc =
    kycResponseType === 'url' ? await generateWebSdkLink(id) : await generateAccessToken(id);

  const ineligibleReason = `KYC verification required for ${address}: ${method.provider} level ${method.levelName}`;

  return {
    eligible: false,
    kyc,
    ineligibleReason,
  };
}
