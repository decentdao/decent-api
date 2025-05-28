import { SupportedChainId } from 'decent-sdk';
import { getAddress } from 'viem';
import { ListResponse, SafeMultisigTransactionResponse } from './types';

const API_URL = (chainId: SupportedChainId) => {
  let chain = 'mainnet';
  if (chainId === 1) {
    chain = 'mainnet';
  } else if (chainId === 137) {
    chain = 'polygon';
  } else if (chainId === 8453) {
    chain = 'base';
  } else if (chainId === 10) {
    chain = 'optimism';
  } else {
    throw new Error(`Unsupported chainId: ${chainId}`);
  }
  return `https://safe-transaction-${chain}.safe.global/api/v2`;
};

export const getExecutedSafeTransactions = async (chainId: SupportedChainId, _address: string) => {
  const url = API_URL(chainId);
  const address = getAddress(_address);
  const response = await fetch(`${url}/safes/${address}/multisig-transactions`);
  const data = await response.json();
  return data as ListResponse<SafeMultisigTransactionResponse>;
};
