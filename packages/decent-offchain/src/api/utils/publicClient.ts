import { mainnet, base, optimism, polygon, sepolia } from 'viem/chains';
import { SupportedChainId } from 'decent-sdk';
import { createPublicClient, http, PublicClient } from 'viem';
import { getAlchemyApiUrl } from '@/lib/alchemy';

export const publicClients: Record<SupportedChainId, PublicClient> = {
  1: createPublicClient({
    chain: mainnet,
    transport: http(getAlchemyApiUrl(1)),
  }),
  10: createPublicClient({
    chain: optimism,
    transport: http(getAlchemyApiUrl(10)),
  }) as PublicClient,
  137: createPublicClient({
    chain: polygon,
    transport: http(getAlchemyApiUrl(137)),
  }),
  8453: createPublicClient({
    chain: base,
    transport: http(getAlchemyApiUrl(8453)),
  }) as PublicClient,
  11155111: createPublicClient({
    chain: sepolia,
    transport: http(getAlchemyApiUrl(11155111)),
  }),
};

export const getPublicClient = (chainId: SupportedChainId): PublicClient => {
  const client = publicClients[chainId];
  if (!client) {
    throw new Error(`No public client available for chainId: ${chainId}`);
  }
  return client;
};

export const publicClient = publicClients[1];
