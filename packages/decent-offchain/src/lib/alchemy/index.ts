import { SupportedChainId } from 'decent-sdk';
import { Address, Hex } from 'viem';

function composeNftUrl(baseUrl: string | undefined) {
  return (baseUrl || '') + process.env.ALCHEMY_NFT_ENDPOINT + process.env.ALCHEMY_API_KEY;
}

const nftUrls: Record<SupportedChainId, string> = {
  1: composeNftUrl(process.env.ALCHEMY_URL_1),
  8453: composeNftUrl(process.env.ALCHEMY_URL_8453),
  10: composeNftUrl(process.env.ALCHEMY_URL_10),
  137: composeNftUrl(process.env.ALCHEMY_URL_137),
  11155111: composeNftUrl(process.env.ALCHEMY_URL_11155111),
};

const getNftUrl = (chainId: SupportedChainId): string => {
  const url = nftUrls[chainId];
  if (!url) {
    throw new Error(`No NFT API url available for chainId: ${chainId}`);
  }
  return url;
};

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
  const url = `${getNftUrl(chainId)}/getNFTsForOwner?owner=${owner}&contractAddresses%5B%5D=${contract}&withMetadata=${withMetadata}`;
  const response = await fetch(url);

  return (await response.json()) as NFTForOwnerResponse;
}
