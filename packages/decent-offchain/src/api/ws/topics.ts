import { Address } from 'viem';

export const Topics = {
  dao(chainId: number, address: Address) {
    return `dao:${chainId}:${address}`;
  },

  proposal(chainId: number, address: Address, proposalId: number) {
    return `proposal:${chainId}:${address}:${proposalId}`;
  },

  comments(chainId: number, address: Address, proposalId: number) {
    return `comments:${chainId}:${address}:${proposalId}`;
  },
};
