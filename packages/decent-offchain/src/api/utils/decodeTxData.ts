import {
  Abi,
  AbiDecodingDataSizeTooSmallError,
  AbiDecodingZeroDataError,
  AbiFunctionSignatureNotFoundError,
  AbiParameter,
  Address,
  ByteArray,
  bytesToHex,
  decodeAbiParameters,
  DecodeAbiParametersReturnType,
  decodeFunctionData,
  DecodeFunctionDataParameters,
  Hex,
  hexToBytes,
  size,
  slice,
  toFunctionSelector,
} from 'viem';
import { Transaction } from '@/db/schema/onchain';
import { Optional } from 'decent-sdk';
import { formatAbiItem } from 'viem/utils';
import { createCursor, Cursor } from 'node_modules/viem/_types/utils/cursor';
import { getArrayComponents } from 'node_modules/viem/_types/utils/abi/encodeAbiParameters';

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
};

type EtherscanResponse<T> = {
  status: string;
  message: string;
  result: T;
};

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
};

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
    const decoded = decodeFunction({
      abi,
      data: transaction.data as `0x${string}`,
    });
    return decoded;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export type DecodedTransaction = {
  to: Address;
  value?: Optional<bigint>;
  callData?: Optional<CallFunction>;
};

export type CallParam = {
  name?: string;
  type: string;
  value: unknown;
};

export type CallFunction = {
  functionName: string;
  params?: Optional<CallParam[]>;
};

export function decodeParameters<const params extends readonly AbiParameter[]>(
  params: params,
  data: ByteArray | Hex,
): CallParam[] {
  const paramValues = decodeAbiParameters(params, data);
  const callparams: CallParam[] = [];
  for (let i = 0; i < params.length; i++) {
    callparams.push({
      name: params[i]!.name,
      type: params[i]!.type,
      value: paramValues[i],
    });
  }
  return callparams;
}

export function decodeFunction<const abi extends Abi | readonly unknown[]>(
  parameters: DecodeFunctionDataParameters<abi>,
): CallFunction {
  const { abi, data } = parameters as DecodeFunctionDataParameters;
  const signature = slice(data, 0, 4);
  const description = abi.find(
    x => x.type === 'function' && signature === toFunctionSelector(formatAbiItem(x)),
  );
  if (!description)
    throw new AbiFunctionSignatureNotFoundError(signature, {
      docsPath: '/docs/contract/decodeFunctionData',
    });
  const params =
    'inputs' in description && description.inputs && description.inputs.length > 0
      ? decodeParameters(description.inputs, slice(data, 4))
      : undefined;
  return {
    functionName: (description as { name: string }).name,
    params: params,
  };
}

export async function formatTx(
  transaction: Transaction,
  chainId: number,
): Promise<DecodedTransaction> {
  if (!transaction.to) {
    throw new Error('Transaction "to" address is required');
  }
  if (transaction.data === '0x') {
    return {
      to: transaction.to,
      value: transaction.value,
    };
  } else {
    const decoded = await decodeTxData(transaction, chainId);
    return {
      to: transaction.to,
      callData: decoded,
    };
  }
}
