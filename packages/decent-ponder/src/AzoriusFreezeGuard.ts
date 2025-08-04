import { ponder } from 'ponder:registry';
import { freezeVotingStrategy, governanceModule } from 'ponder:schema';

ponder.on('AzoriusFreezeGuard:AzoriusFreezeGuardSetUp', async({ event, context }) => {
  try {
    const { owner, freezeVoting } = event.args;
    const address = event.log.address;
    const daoChainId = context.chain.id;
    await context.db.insert(governanceModule).values({
      address,
      daoAddress: owner,
      daoChainId,
      moduleType: 'FRACTAL'
    }).onConflictDoUpdate({
      daoAddress: owner,
      daoChainId,
      moduleType: 'FRACTAL'
    });

    await context.db.insert(freezeVotingStrategy).values({
      address: freezeVoting,
      governanceModuleId: address
    }).onConflictDoUpdate({ governanceModuleId: address })
  } catch (e) {
    console.error('AzoriusFreezeGuard:AzoriusFreezeGuardSetUp', e);
  }
});
