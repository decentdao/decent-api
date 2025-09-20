import { Address, Hex } from 'viem';

export type VerificationData = {
  operator: Address;
  account: Address;
  signatureExpiration: number;
  nonce: bigint;
};

export type VerificationSignature = {
  data: VerificationData;
  signature: Hex;
};
