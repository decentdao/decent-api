import {
  Abi,
  AbiFunctionSignatureNotFoundError,
  AbiParameter,
  Address,
  ByteArray,
  decodeAbiParameters,
  DecodeFunctionDataParameters,
  Hex,
  slice,
  toFunctionSelector,
} from 'viem';
import { Transaction } from '@/db/schema/onchain';
import { Optional } from 'decent-sdk';
import { formatAbiItem } from 'viem/utils';
import detectProxyTarget from 'evm-proxy-detection';
import { EIP1193ProviderRequestFunc } from 'node_modules/evm-proxy-detection/build/cjs/types';
import { getErc20Meta, humanReadableErc20Value, humanReadableNativeTokenValue } from './erc20';

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
  masterAddress?: Address;
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

export async function decodeTx(
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
    const eip1193ProviderRequestFunc = getEip1193ProviderRequestFunc(chainId);
    const masterAddress = await detectProxyTarget(transaction.to, eip1193ProviderRequestFunc);
    return {
      to: transaction.to,
      masterAddress: masterAddress?.target as Address,
      callData: decoded,
    };
  }
}

export function getRpcUrl(chainId: number): string | undefined {
  switch (chainId) {
    case 1:
      return process.env.PONDER_RPC_URL_1;
    case 10:
      return process.env.PONDER_RPC_URL_10;
    case 137:
      return process.env.PONDER_RPC_URL_137;
    case 8453:
      return process.env.PONDER_RPC_URL_8453;
    case 11155111:
      return process.env.PONDER_RPC_URL_11155111;
    default:
      return undefined;
  }
}

const providerRequestFuncCache = new Map<number, EIP1193ProviderRequestFunc>();

export function getEip1193ProviderRequestFunc(chainId: number): EIP1193ProviderRequestFunc {
  if (providerRequestFuncCache.has(chainId)) {
    return providerRequestFuncCache.get(chainId)!;
  }

  const rpcUrl = getRpcUrl(chainId);
  if (!rpcUrl) throw new Error(`No RPC URL configured for chainId ${chainId}`);

  const providerFunc: EIP1193ProviderRequestFunc = async ({ method, params }) => {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params: params || [],
      }),
    });
    const json = (await response.json()) as { result?: unknown; error?: { message: string } };
    if (json && typeof json === 'object' && 'error' in json && json.error) {
      throw new Error(json.error.message);
    }
    return json.result;
  };

  providerRequestFuncCache.set(chainId, providerFunc);
  return providerFunc;
}

export type FormattedTransaction = {
  envelope: string;
  function: string;
  params?: Record<string, string>;
};

export function getNativeTokenSymbol(chainId: number): string {
  switch (chainId) {
    case 137:
      return 'POL';

    case 1:
    case 10:
    case 8453:
    case 11155111:
    default:
      return 'ETH';
  }
}

export async function paramsArrayToFormattedObject(
  chainId: number,
  params: CallParam[],
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  let erc20Meta: { symbol: string; decimals: number } | undefined;
  let erc20Value: bigint | undefined;

  async function formatValue(
    name: string | undefined,
    type: string,
    value: unknown,
  ): Promise<string> {
    if (value === null || value === undefined) return '';

    // Integer types
    if (type.startsWith('uint') || type.startsWith('int')) {
      if (!erc20Value && typeof value === 'bigint' && (name === 'value' || name === 'amount')) {
        erc20Value = value;
      }
      return value.toString();
    }
    // Address
    if (type === 'address') {
      if (!erc20Meta) {
        erc20Meta = await getErc20Meta(chainId, value as Address);
      }
      return String(value);
    }
    // Boolean
    if (type === 'bool') {
      return value ? 'true' : 'false';
    }
    // Bytes (fixed or dynamic)
    if (type === 'bytes' || type.startsWith('bytes')) {
      return typeof value === 'string' ? value : JSON.stringify(value);
    }
    // String
    if (type === 'string') {
      return String(value);
    }
    // Function type (20 bytes)
    if (type === 'function') {
      return String(value);
    }
    // Array types (fixed or dynamic)
    if (type.endsWith(']') && Array.isArray(value)) {
      // Extract base type for array elements
      const baseType = type.replace(/\[.*\]$/, '');
      return `[${(await Promise.all(value.map(v => formatValue(undefined, baseType, v)))).join(', ')}]`;
    }
    // Tuple (struct)
    if (type === 'tuple' && Array.isArray(value)) {
      // Format as JSON object
      return JSON.stringify(value.map(v => (typeof v === 'object' ? v : String(v))));
    }
    // Fallback
    return String(value);
  }

  for (const [idx, param] of params.entries()) {
    const key = param.name && param.name.length > 0 ? param.name : `param${idx}`;
    result[key] = await formatValue(param.name, param.type, param.value);
  }

  if (erc20Value && erc20Meta) {
    const erc20 = await humanReadableErc20Value(erc20Meta, erc20Value);
    result['erc20Symbol'] = erc20.symbol;
    result['erc20Value'] = erc20.value;
  }

  return result;
}

export async function formatTx(
  transaction: Transaction,
  chainId: number,
): Promise<FormattedTransaction> {
  const decoded = await decodeTx(transaction, chainId);
  if (!decoded.callData) {
    // transfering ETH
    return {
      envelope: 'Native',
      function: 'transfer',
      params: {
        to: decoded.to,
        value: humanReadableNativeTokenValue(decoded.value || BigInt(0)),
        tokenSymbol: getNativeTokenSymbol(chainId),
      },
    };
  } else {
    const params = decoded.callData.params || [];
    return {
      envelope: decoded.masterAddress ?? decoded.to,
      function: decoded.callData.functionName,
      params: await paramsArrayToFormattedObject(chainId, params),
    };
  }
}
