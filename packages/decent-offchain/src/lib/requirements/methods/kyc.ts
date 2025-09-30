import { Address } from 'viem';
import { eq, and, ne } from 'drizzle-orm';
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
  if (method.provider !== 'sumsub') throw new Error('KYC provider not supported');

  const applicant = (await db.query.kycTable.findFirst({
    where: and(
      eq(kycTable.address, address),
      ne(kycTable.reviewStatus, 'init')
    )
  }));

  if (applicant?.isKycApproved) {
    return {
      eligible: true,
    };
  }

  if (applicant?.rejectLabels) {
    const ineligibleReason = `KYC verification failed: ${applicant?.rejectLabels?.join(', ')}`;
    return {
      eligible: false,
      ineligibleReason,
    }
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

  return {
    eligible: false,
    kyc,
  };
}
