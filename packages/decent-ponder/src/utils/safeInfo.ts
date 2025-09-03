import { Address, getAddress } from 'viem';
import { Context } from 'ponder:registry';
import { GnosisSafeL2Abi } from '../../abis/GnosisSafeL2Abi';

export async function isSafeCheck(context: Context, _safeAddress: Address) {
  try {
    const address = getAddress(_safeAddress);
    await context.client.multicall({
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

    return true;
  } catch (error) {
    return false;
  }
}
