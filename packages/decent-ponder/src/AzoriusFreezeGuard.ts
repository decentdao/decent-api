import { ponder } from 'ponder:registry';
import { freezeVotingStrategy } from 'ponder:schema';

// other freeze voting settings are covered by the common
// event topics in `MultisigFreezeVoting`

ponder.on('AzoriusFreezeGuard:AzoriusFreezeGuardSetUp', async ({ event, context }) => {
  try {
    const { freezeVoting } = event.args;
    const address = event.log.address;
    await context.db
      .update(freezeVotingStrategy, { address: freezeVoting })
      .set({ governanceGuardId: address });
  } catch (e) {
    console.error('AzoriusFreezeGuard:AzoriusFreezeGuardSetUp', e);
  }
});
