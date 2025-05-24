import { Abi, Address, decodeFunctionData } from 'viem';
import { Transaction } from '@/db/schema/onchain';

type EtherscanContractSource = {
  SourceCode: string;
  ABI: string;
  ContractName: string;
  CompilerVersion: string;
  OptimizationUsed: string;
  Runs: string;
  ConstructorArguments: string;
  EVMVersion: string;
  Library: string;
  LicenseType: string;
  Proxy: string;
  Implementation: string;
  SwarmSource: string;
}

type EtherscanResponse<T> = {
  status: string;
  message: string;
  result: T;
}

const getProxyAbi = async (address: Address, chainId: number) => {
  const params = new URLSearchParams({
    chainId: chainId.toString(),
    module: 'contract',
    action: 'getabi',
    address: address,
    apikey: process.env.ETHERSCAN_KEY || '',
  });
  const data = await fetch(`https://api.etherscan.io/v2/api?${params.toString()}`);
  const json = (await data.json()) as EtherscanResponse<string>;
  if (json.status !== '1') throw new Error(`Etherscan API error: ${json.result}`);
  if (!json.result) throw new Error('No contract source found');
  const abi = JSON.parse(json.result);
  return abi as Abi;
}

async function getAbi(address: Address, chainId: number) {
  const params = new URLSearchParams({
    chainId: chainId.toString(),
    module: 'contract',
    action: 'getsourcecode',
    address: address,
    apikey: process.env.ETHERSCAN_KEY || '',
  });
  const data = await fetch(`https://api.etherscan.io/v2/api?${params.toString()}`);
  const json = (await data.json()) as EtherscanResponse<EtherscanContractSource[]>;
  if (json.status !== '1') throw new Error(`Etherscan API error: ${json.result}`);
  if (!json.result || !json.result[0]) throw new Error('No contract source found');

  if (json.result[0].Proxy === '1') {
    const abi = await getProxyAbi(json.result[0].Implementation as `0x${string}`, chainId);
    return abi;
  }

  const abi = JSON.parse(json.result[0].ABI);
  return abi as Abi;
}

export async function decodeTxData(transaction: Transaction, chainId: number) {
  try {
    const abi = await getAbi(transaction.to, chainId);
    const decoded = decodeFunctionData({
      abi,
      data: transaction.data as `0x${string}`,
    });
    return decoded;
  } catch (error) {
    console.error(error);
    return null;
  }
}
