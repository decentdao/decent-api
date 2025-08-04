import { Address, getAddress } from 'viem';
import { Context } from 'ponder:registry';
import { safeInfo } from './safe';
import {
  SignerInsert,
  SignerToDaoInsert,
} from 'ponder:schema';

export type GovernanceInsert = {
  address: Address;
  threshold: number;
  signers: SignerInsert[];
  signerToDaos: SignerToDaoInsert[];
};

export async function fetchGovernance(
  context: Context,
  _safeAddress: Address,
): Promise<GovernanceInsert> {
  try {
    const safeAddress = getAddress(_safeAddress);
    const daoChainId = context.chain.id;
    const { threshold, owners } = await safeInfo(context, safeAddress);

    const signers: SignerInsert[] = owners.map(owner => ({
      address: owner,
    }));

    const signerToDaos: SignerToDaoInsert[] = signers.map(signer => ({
      address: signer.address,
      daoChainId,
      daoAddress: safeAddress,
    }));

    return {
      address: safeAddress,
      threshold: Number(threshold ? threshold : 0),
      signers,
      signerToDaos,
    };
  } catch (error) {
    console.error(error);
    throw new Error(`Failed to fetch safe: ${_safeAddress}`);
  }
}
