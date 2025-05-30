import { Abi, Address } from 'viem';
import { EtherscanContractSource, EtherscanResponse } from './types';

const API = 'https://api.etherscan.io/v2/api';

const getProxyAbi = async (address: Address, chainId: number) => {
  const params = new URLSearchParams({
    chainId: chainId.toString(),
    module: 'contract',
    action: 'getabi',
    address: address,
    apikey: process.env.ETHERSCAN_KEY || '',
  });
  const data = await fetch(`${API}?${params.toString()}`);
  const json = (await data.json()) as EtherscanResponse<string>;
  if (json.status !== '1') throw new Error(`Etherscan API error: ${json.result}`);
  if (!json.result) throw new Error('No contract source found');
  const abi = JSON.parse(json.result);
  return abi as Abi;
};

export async function getContract(address: Address, chainId: number) {
  const params = new URLSearchParams({
    chainId: chainId.toString(),
    module: 'contract',
    action: 'getsourcecode',
    address: address,
    apikey: process.env.ETHERSCAN_KEY || '',
  });
  const data = await fetch(`${API}?${params.toString()}`);
  const json = (await data.json()) as EtherscanResponse<EtherscanContractSource[]>;
  if (json.status !== '1') throw new Error(`Etherscan API error: ${json.result}`);
  if (!json.result || !json.result[0]) throw new Error('No contract source found');

  const isProxyContract = json.result[0].Proxy === '1';
  let abi: Abi | null = null;
  let implementation: Address | null = null;
  if (isProxyContract) {
    implementation = json.result[0].Implementation;
    if (!implementation) throw new Error('Proxy contract missing implementation address');
    abi = await getProxyAbi(implementation, chainId);
    if (!abi) throw new Error('No proxy ABI found');
  } else {
    abi = JSON.parse(json.result[0].ABI);
  }

  if (!abi) throw new Error('No ABI found');

  return {
    name: json.result[0].ContractName,
    address,
    chainId,
    abi,
    implementation,
  };
}
