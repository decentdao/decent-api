import { Address } from 'viem';

export const VERIFIER_V1_ADDRESS = '0xA8F29B98c6237cdc93E43787E949b018855a6002' as Address;

export const DOMAIN = {
  name: 'Verifier',
  version: '1',
  chainId: 0,
  verifyingContract: VERIFIER_V1_ADDRESS,
} as const;

export const TYPES = {
  VerificationData: [
    { name: 'operator', type: 'address' },
    { name: 'account', type: 'address' },
    { name: 'signatureExpiration', type: 'uint48' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

export const VERIFIER_ABI = [
  {
    name: 'nonce',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account_', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export const EXPIRATION_SECONDS = 15 * 60;
