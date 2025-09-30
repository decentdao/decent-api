import { getAddress, zeroAddress } from 'viem';
import { legacy } from '@decentdao/decent-contracts';
import { ponder } from 'ponder:registry';
import { governanceGuard, governanceModule } from 'ponder:schema';

// keccak256("guard_manager.guard.address")
// https://github.com/safe-global/safe-smart-account/blob/1c8b24a0a438e8c2cd089a9d830d1688a47a28d5/contracts/base/GuardManager.sol#L66
export const GUARD_STORAGE_SLOT =
  '0x4a204f620c8c5ccdca3fd54d003badd85ba500436a431f0cbda4f558c93c34c8';

ponder.on('FractalModule:ControllersAdded', async ({ event, context }) => {
  try {
    // this seems like the best event to make sure its a FractalModule
    // and not some other random module we don't care about
    const address = event.log.address;
    const daoAddress = await context.client.readContract({
      address,
      abi: legacy.abis.FractalModule,
      functionName: 'target',
    });
    const daoChainId = context.chain.id;
    await context.db
      .insert(governanceModule)
      .values({
        address,
        daoAddress,
        daoChainId,
        moduleType: 'FRACTAL',
      })
      .onConflictDoNothing();

    // get guard address once a FractalModule is added
    const guardStorageValue = await context.client.getStorageAt({
      address: daoAddress,
      slot: GUARD_STORAGE_SLOT,
    });
    const guard = getAddress(`0x${guardStorageValue?.slice(-40)}`);
    if (guard !== zeroAddress) {
      await context.db
        .insert(governanceGuard)
        .values({
          address: guard,
          daoAddress,
          daoChainId,
        })
        .onConflictDoNothing();
    }
  } catch (e) {
    console.error('FractalModule:AvatarSet', e);
  }
});
