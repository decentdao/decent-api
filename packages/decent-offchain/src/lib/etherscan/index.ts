import { getPublicClient } from '@/api/utils/publicClient';
import { SupportedChainId } from 'decent-sdk';
import detectProxyTarget from 'evm-proxy-detection';
import { Abi, Address } from 'viem';

export const getEtherscanAPIUrl = (chainId: number) => {
  return `https://api.etherscan.io/v2/api?chainid=${chainId}&apikey=${process.env.ETHERSCAN_API_KEY}`;
};

export interface EtherscanABIResponse {
  status: string;
  message: string;
  result: string;
}

export async function getABI(chainId: SupportedChainId, to: Address) {
  const client = getPublicClient(chainId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requestFunc = ({ method, params }: { method: any; params: any }) =>
    client.request({ method, params });
  const implementationAddress = await detectProxyTarget(to, requestFunc);
  const url = `${getEtherscanAPIUrl(chainId)}&module=contract&action=getabi&address=${implementationAddress || to}`;
  const response = await fetch(url);

  const responseData = (await response.json()) as EtherscanABIResponse;
  if (responseData.result === 'Contract source code not verified') {
    return undefined;
  }
  if (responseData.result.startsWith('Missing')) {
    console.debug('Missing Error??? ', responseData.result);
    return undefined;
  }
  return JSON.parse(responseData.result) as Abi;
}
