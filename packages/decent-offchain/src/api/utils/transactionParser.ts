import { DataDecoded, DecodedParameters } from '@/lib/safe/types';
import { DecodedTransaction } from '../types';
import { AbiFunction, Address, decodeFunctionData, getAddress, Hex } from 'viem';
import { decodeTransactionData } from '@/lib/safe';
import { SupportedChainId } from 'decent-sdk';
import { getABI } from '@/lib/etherscan';

export const ADDRESS_MULTISIG_METADATA = '0xdA00000000000000000000000000000000000Da0';

export function isMultisigRejectionProposal(
  safeAddress: string,
  data: Hex | null | undefined,
  to: Address,
  value: bigint,
) {
  return !data && to === safeAddress && value === 0n;
}

export const parseMultiSendTransactions = (
  eventTransactionMap: Map<number, DecodedTransaction>,
  parameters?: DecodedParameters[],
) => {
  if (!parameters || !parameters.length) {
    return;
  }
  parameters.forEach((param: DecodedParameters) => {
    const valueDecoded = param.valueDecoded;
    if (Array.isArray(valueDecoded)) {
      valueDecoded.forEach(value => {
        const decodedTransaction = {
          target: getAddress(value.to),
          value: value.value, // This is the ETH value
          function: value.dataDecoded?.method || '',
          parameterTypes:
            !!value.dataDecoded && value.dataDecoded.parameters
              ? value.dataDecoded.parameters.map(p => p.type)
              : [],
          parameterValues:
            !!value.dataDecoded && value.dataDecoded.parameters
              ? value.dataDecoded.parameters.map(p => p.value)
              : [],
        };
        eventTransactionMap.set(eventTransactionMap.size, {
          ...decodedTransaction,
        });
        if (value.dataDecoded?.parameters && value.dataDecoded?.parameters?.length) {
          return parseMultiSendTransactions(eventTransactionMap, value.dataDecoded.parameters);
        }
      });
    }
  });
};

export const parseDecodedData = (
  to: string,
  value: string,
  dataDecoded: DataDecoded,
  isMultiSigTransaction: boolean,
): DecodedTransaction[] => {
  const eventTransactionMap = new Map<number, DecodedTransaction>();
  if (dataDecoded && isMultiSigTransaction) {
    const decodedTransaction: DecodedTransaction = {
      target: getAddress(to),
      value,
      function: dataDecoded.method,
      parameterTypes: dataDecoded.parameters ? dataDecoded.parameters.map(p => p.type) : [],
      parameterValues: dataDecoded.parameters
        ? dataDecoded.parameters.map(p => p.value.toString())
        : [],
    };
    eventTransactionMap.set(eventTransactionMap.size, {
      ...decodedTransaction,
    });
    parseMultiSendTransactions(eventTransactionMap, dataDecoded.parameters);
  }
  return Array.from(eventTransactionMap.values());
};

export async function decodeWithAPI(
  chainId: SupportedChainId,
  value: string,
  to: Address,
  data?: string | null,
): Promise<DecodedTransaction[]> {
  if (!data || data.length <= 2) {
    // a transaction without data is an Eth transfer
    return [
      {
        target: to,
        value,
        function: 'n/a',
        parameterTypes: ['n/a'],
        parameterValues: ['n/a'],
        decodingFailed: false,
      },
    ];
  }

  let decoded: DecodedTransaction | DecodedTransaction[];
  try {
    try {
      const decodedData = await decodeTransactionData(chainId, data, to);
      if (decodedData.parameters && decodedData.method === 'multiSend') {
        const internalTransactionsMap = new Map<number, DecodedTransaction>();
        parseMultiSendTransactions(internalTransactionsMap, decodedData.parameters);
        decoded = [...internalTransactionsMap.values()].flat();
      } else {
        decoded = [
          {
            target: to,
            value,
            function: decodedData.method,
            parameterTypes: decodedData.parameters.map(param => param.type),
            parameterValues: decodedData.parameters.map(param => param.value),
            decodingFailed: false,
          },
        ];
      }
    } catch (e) {
      console.error('Error decoding transaction using Safe API. Trying to decode with ABI', e);
      const abi = await getABI(chainId, to);
      if (abi === undefined) {
        return [
          {
            target: to,
            value: value,
            function: 'unknown',
            parameterTypes: [],
            parameterValues: [],
            decodingFailed: true,
          },
        ];
      }
      const decodedData = decodeFunctionData({
        abi,
        data: data as Hex,
      });
      const functionAbi = abi.find(
        abiItem =>
          abiItem.type === 'function' && (abiItem as AbiFunction).name === decodedData.functionName,
      ) as AbiFunction;
      decoded = [
        {
          target: to,
          value,
          function: decodedData.functionName,
          parameterTypes: functionAbi.inputs.map(input => input.type),
          parameterValues: [...(decodedData.args ?? [])] as string[],
          decodingFailed: false,
        },
      ];
    }
  } catch (e) {
    console.error('Error decoding transaction using ABI. Returning empty decoded transaction', e);
    return [
      {
        target: to,
        value: value,
        function: 'unknown',
        parameterTypes: [],
        parameterValues: [],
        decodingFailed: true,
      },
    ];
  }

  return decoded;
}
