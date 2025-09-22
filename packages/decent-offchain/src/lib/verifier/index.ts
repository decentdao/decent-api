import { Address, Hex, zeroAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { SupportedChainId } from 'decent-sdk';
import { unixTimestamp } from '@/api/utils/time';
import { getPublicClient } from '@/api/utils/publicClient';
import { VerificationData, VerificationSignature } from './types';
import { DOMAIN, EXPIRATION_SECONDS, TYPES, VERIFIER_ABI, VERIFIER_V1_ADDRESS } from './constants';

const VERIFIER_PRIVATE_KEY = process.env.VERIFIER_PRIVATE_KEY as Hex;

const verifier = VERIFIER_PRIVATE_KEY ? privateKeyToAccount(VERIFIER_PRIVATE_KEY) : undefined;

export async function getAddressNonce(chainId: SupportedChainId, address: Address) {
  const client = getPublicClient(chainId);
  const nonce = await client.readContract({
    address: VERIFIER_V1_ADDRESS,
    abi: VERIFIER_ABI,
    functionName: 'nonce',
    args: [address],
  });
  return nonce;
}

export async function signVerification(
  chainId: SupportedChainId,
  data: VerificationData,
): Promise<VerificationSignature> {
  if (!verifier) throw new Error('VERIFIER_PRIVATE_KEY not set');
  const domain = {
    ...DOMAIN,
    chainId,
  };

  const signature = await verifier.signTypedData({
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
  if (!verifier) return zeroAddress;
  return verifier.address;
}

export function formatVerificationData(
  operator: Address,
  account: Address,
  nonce: bigint,
): VerificationData {
  const signatureExpiration = unixTimestamp() + EXPIRATION_SECONDS;

  return {
    operator,
    account,
    signatureExpiration,
    nonce,
  };
}
