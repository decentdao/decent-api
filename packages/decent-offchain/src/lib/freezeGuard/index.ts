import { SupportedChainId } from 'decent-sdk';
import { Address } from 'viem';
import { legacy } from '@decentdao/decent-contracts';
import { getPublicClient } from '@/api/utils/publicClient';
import { FreezeInfo } from './types';

export const getFreezeInfo = async (
  chainId: SupportedChainId,
  freezeGuardAddress: Address,
): Promise<FreezeInfo> => {
  const publicClient = getPublicClient(chainId);

  // First check if frozen
  const isFrozen = await publicClient.readContract({
    abi: legacy.abis.MultisigFreezeVoting,
    address: freezeGuardAddress,
    functionName: 'isFrozen',
  });

  // Only fetch the created block if frozen
  const freezeProposalCreatedBlock = isFrozen
    ? await publicClient.readContract({
        abi: legacy.abis.MultisigFreezeVoting,
        address: freezeGuardAddress,
        functionName: 'freezeProposalCreatedBlock',
      })
    : undefined;

  return {
    isFrozen,
    freezeProposalCreatedBlock,
  };
};
