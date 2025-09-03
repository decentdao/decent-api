import { SupportedChainId } from 'decent-sdk';
import { getAddress, decodeAbiParameters, parseAbiParameters, Address } from 'viem';
import { BasicSafeInfo, ListResponse, SafeMultisigTransactionResponse } from './types';
import { getPublicClient } from '@/api/utils/publicClient';
import { GnosisSafeL2Abi } from './GnosisSafeL2Abi';

const ADDRESS_MULTISIG_METADATA = '0xdA00000000000000000000000000000000000Da0';

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
  } else if (chainId === 11155111) {
    chain = 'sepolia';
  } else {
    throw new Error(`Unsupported chainId: ${chainId}`);
  }
  return `https://safe-transaction-${chain}.safe.global/api/v2`;
};

export const getSafeTransactions = async (
  chainId: SupportedChainId,
  _address: Address,
  since?: Date,
) => {
  const url = API_URL(chainId);
  const address = getAddress(_address);
  const params = new URLSearchParams({
    limit: '1000',
    submission_date__gte: since?.toISOString() || '',
  });

  const response = await fetch(
    `${url}/safes/${address}/multisig-transactions?${params.toString()}`,
  );
  const data = (await response.json()) as ListResponse<SafeMultisigTransactionResponse>;
  return data;
};

export const getCIDFromSafeTransaction = (tx: SafeMultisigTransactionResponse): string | null => {
  let cid: string | null = null;
  if (tx.dataDecoded?.method === 'multiSend') {
    tx.dataDecoded?.parameters.find(p => {
      p.valueDecoded?.find(v => {
        if (v.to === ADDRESS_MULTISIG_METADATA) {
          const data = v.data as `0x${string}`;
          [cid] = decodeAbiParameters(parseAbiParameters('string'), data);
          return true;
        }
      });
    });
  }
  return cid;
};

export const getSafeInfo = async (
  chainId: SupportedChainId,
  _address: Address,
): Promise<BasicSafeInfo> => {
  const publicClient = getPublicClient(chainId);
  const address = getAddress(_address);
  const [threshold, owners, nonce] = await publicClient.multicall({
    contracts: [
      {
        abi: GnosisSafeL2Abi,
        address,
        functionName: 'getThreshold',
      },
      {
        abi: GnosisSafeL2Abi,
        address,
        functionName: 'getOwners',
      },
      {
        abi: GnosisSafeL2Abi,
        address,
        functionName: 'nonce',
      },
    ],
    allowFailure: false,
  });

  return {
    nonce: Number(nonce),
    threshold: Number(threshold),
    owners: Array(...owners), // to convert from readonly
  };
};
