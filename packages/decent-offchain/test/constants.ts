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
