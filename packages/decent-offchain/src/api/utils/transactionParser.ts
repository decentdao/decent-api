import { DataDecoded, DecodedParameters } from '@/lib/safe/types';
import { DecodedTransaction } from '../types';
import { Address, getAddress, Hex } from 'viem';

export const ADDRESS_MULTISIG_METADATA = '0xdA00000000000000000000000000000000000Da0';

export function isMultisigRejectionProposal(
  safeAddress: string,
  data: Hex,
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
