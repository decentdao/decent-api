import { Address, Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { SupportedChainId } from 'decent-sdk';
import { unixTimestamp } from '@/api/utils/time';
import { VerificationData, VerificationSignature } from './types';
import { DOMAIN, TYPES } from './constants';

const VERIFIER_PRIVATE_KEY = process.env.VERIFIER_PRIVATE_KEY as Hex;
if (!VERIFIER_PRIVATE_KEY) throw new Error('VERIFIER_PRIVATE_KEY is not set');

export async function signVerification(
  chainId: SupportedChainId,
  verifierContract: Address,
  data: VerificationData,
): Promise<VerificationSignature> {
  const account = privateKeyToAccount(VERIFIER_PRIVATE_KEY);

  const domain = {
    ...DOMAIN,
    chainId,
    verifyingContract: verifierContract,
  };

  const signature = await account.signTypedData({
    domain,
    types: TYPES,
    primaryType: 'VerificationData',
    message: data,
  });

  return {
    data,
    signature,
  };
}

export function getSignerAddress(): Address {
  return privateKeyToAccount(VERIFIER_PRIVATE_KEY).address;
}

export async function getVerificationData(
  operator: Address,
  account: Address,
  expirationMinutes: number = 60,
  nonce: bigint = 0n,
): Promise<VerificationData> {
  const signatureExpiration = unixTimestamp() + expirationMinutes * 60;

  return {
    operator,
    account,
    signatureExpiration,
    nonce,
  };
}
