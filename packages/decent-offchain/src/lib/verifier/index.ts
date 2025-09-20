import { Address, Hex, zeroAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { SupportedChainId } from 'decent-sdk';
import { unixTimestamp } from '@/api/utils/time';
import { getPublicClient } from '@/api/utils/publicClient';
import { VerificationData, VerificationSignature } from './types';
import { DOMAIN, EXPIRATION_SECONDS, TYPES, VERIFIER_ABI } from './constants';

const VERIFIER_PRIVATE_KEY = process.env.VERIFIER_PRIVATE_KEY as Hex;
if (!VERIFIER_PRIVATE_KEY) throw new Error('VERIFIER_PRIVATE_KEY is not set');

const verifier = privateKeyToAccount(VERIFIER_PRIVATE_KEY);

export async function getAddressNonce(chainId: SupportedChainId, address: Address) {
  const client = getPublicClient(chainId);
  const nonce = await client.readContract({
    address: zeroAddress,
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
  return verifier.address;
}

export function getVerificationData(
  operator: Address,
  account: Address,
  nonce: bigint = 0n,
): VerificationData {
  const signatureExpiration = unixTimestamp() + EXPIRATION_SECONDS;

  return {
    operator,
    account,
    signatureExpiration,
    nonce,
  };
}
