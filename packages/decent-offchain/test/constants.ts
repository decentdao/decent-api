import { Address } from 'viem';

const address = '0x07a281d9CF79585282a2ADa24B78B494977DC33E';
export const daoAddress = address.toLowerCase() as Address;
export const daoChainId = 8453;

export const typedData = {
  domain: {
    name: 'Test Domain',
    version: '1',
  },
  types: {
    Message: [{ name: 'content', type: 'string' }],
  },
  primaryType: 'Message',
  message: {
    content: 'Test message for signing',
  },
} as const;

// EIP-712 types for token sale verification
export const VERIFICATION_TYPES = {
  Verification: [
    { name: 'saleAddress', type: 'address' },
    { name: 'signerAddress', type: 'address' },
    { name: 'timestamp', type: 'uint256' },
  ],
};

export const getVerificationDomain = (chainId: number) => ({
  name: 'Decent Token Sale',
  version: '1',
  chainId,
});

export const createVerificationMessage = (
  saleAddress: Address,
  signerAddress: Address,
  timestamp?: number,
) => ({
  saleAddress,
  signerAddress,
  timestamp: timestamp || Math.floor(Date.now() / 1000),
});
