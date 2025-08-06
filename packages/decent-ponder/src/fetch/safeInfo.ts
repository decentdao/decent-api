import { Address, getAddress } from 'viem';
import { Context } from 'ponder:registry';
import {
  SignerInsert,
  SignerToDaoInsert,
} from 'ponder:schema';
import { GnosisSafeL2Abi } from '../../abis/GnosisSafeL2';

export type GovernanceInsert = {
  address: Address;
  threshold: number;
  signers: SignerInsert[];
  signerToDaos: SignerToDaoInsert[];
};

export async function fetchSafeInfo(
  context: Context,
  _safeAddress: Address,
): Promise<GovernanceInsert | undefined> {
  try {
    const address = getAddress(_safeAddress);
    const daoChainId = context.chain.id;
    const [
      threshold,
      owners,
    ] = await context.client.multicall({
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
      ],
      allowFailure: false,
    });

    const signers: SignerInsert[] = owners.map(owner => ({
      address: owner,
    }));

    const signerToDaos: SignerToDaoInsert[] = signers.map(signer => ({
      address: signer.address,
      daoChainId,
      daoAddress: address,
    }));

    return {
      address,
      threshold: Number(threshold ? threshold : 0),
      signers,
      signerToDaos,
    };
  } catch (error) {
    return undefined;
  }
}
