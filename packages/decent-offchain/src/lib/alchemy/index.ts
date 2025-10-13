import { SupportedChainId } from 'decent-sdk';
import { Address, Hex } from 'viem';

const ALCHEMY_BASE_URLS: Record<SupportedChainId, string> = {
  1: 'https://eth-mainnet.g.alchemy.com',
  10: 'https://opt-mainnet.g.alchemy.com',
  137: 'https://polygon-mainnet.g.alchemy.com',
  8453: 'https://base-mainnet.g.alchemy.com',
  11155111: 'https://eth-sepolia.g.alchemy.com',
};

export function getAlchemyApiUrl(chainId: SupportedChainId) {
  return ALCHEMY_BASE_URLS[chainId] + '/v2/' + process.env.ALCHEMY_API_KEY;
}

export function getAlchemyNFTApiUrl(chainId: SupportedChainId) {
  return ALCHEMY_BASE_URLS[chainId] + '/nft/v3/' + process.env.ALCHEMY_API_KEY;
}

export interface NFTForOwnerResponse {
  ownedNfts: { tokenId: string; contractAddress: Hex; isSpam: boolean }[] | null;
  totalCount: number | null;
  validAt: {
    blockNumber: number | null;
    blockHash: Hex | null;
    blockTimestamp: string | null;
  } | null;
}

export async function getNFTsForOwner(
  chainId: SupportedChainId,
  owner: Address,
  contract: Address,
  withMetadata: boolean = false,
) {
  const url = `${getAlchemyNFTApiUrl(chainId)}/getNFTsForOwner?owner=${owner}&contractAddresses%5B%5D=${contract}&withMetadata=${withMetadata}`;
  const response = await fetch(url);

  return (await response.json()) as NFTForOwnerResponse;
}
