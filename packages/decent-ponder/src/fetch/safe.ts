import { Address, getAddress, zeroAddress } from 'viem';
import { Context } from 'ponder:registry';
import { GnosisSafeL2Abi } from '../../abis/GnosisSafeL2';

export async function safeInfo(context: Context, _address: Address) {
  const address = getAddress(_address);

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

  return {
    threshold,
    owners,
  };
}
