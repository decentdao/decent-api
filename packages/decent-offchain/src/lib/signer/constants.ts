import { Address } from 'viem';

export const DOMAIN = {
  name: 'VerifierV1',
  version: '1',
  chainId: 0,
  verifyingContract: '0x0000000000000000000000000000000000000000' as Address,
} as const;

export const TYPES = {
  VerificationData: [
    { name: 'operator', type: 'address' },
    { name: 'account', type: 'address' },
    { name: 'signatureExpiration', type: 'uint48' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;
