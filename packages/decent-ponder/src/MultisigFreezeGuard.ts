import { ponder } from 'ponder:registry';
import { freezeVotingStrategy, governanceModule } from 'ponder:schema';

ponder.on('MultisigFreezeGuard:MultisigFreezeGuardSetup', async ({ event, context}) => {
  try {
    const { childGnosisSafe, freezeVoting } = event.args;
    const address = event.log.address;
    const daoChainId = context.chain.id;
    await context.db.insert(governanceModule).values({
      address,
      daoAddress: childGnosisSafe,
      daoChainId,
      moduleType: 'FRACTAL'
    }).onConflictDoUpdate({
      daoAddress: childGnosisSafe,
      daoChainId,
      moduleType: 'FRACTAL'
    });

    await context.db.insert(freezeVotingStrategy).values({
      address: freezeVoting,
      governanceModuleId: address
    }).onConflictDoUpdate({ governanceModuleId: address })
  } catch (e) {
    console.error('MultisigFreezeGuard:MultisigFreezeGuardSetup', e);
  }
});
