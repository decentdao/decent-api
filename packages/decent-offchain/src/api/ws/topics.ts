import { Address } from 'viem';

export const Topics = {
  dao(chainId: number, address: Address) {
    return `dao:${chainId}:${address}`;
  },

  proposals(chainId: number, address: Address) {
    return `proposals:${chainId}:${address}`;
  },

  comments(chainId: number, address: Address, slug: string) {
    return `comments:${chainId}:${address}:${slug}`;
  },
};
