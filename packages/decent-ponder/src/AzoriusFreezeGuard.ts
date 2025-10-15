import { ponder } from 'ponder:registry';
import { freezeVotingStrategy } from 'ponder:schema';

ponder.on('AzoriusFreezeGuard:AzoriusFreezeGuardSetUp', async ({ event, context }) => {
  try {
    const { freezeVoting } = event.args;
    const address = event.log.address;

    // got freeze voting info so insert it
    await context.db
      .insert(freezeVotingStrategy)
      .values({
        address: freezeVoting,
        governanceGuardId: address,
      })
      .onConflictDoUpdate({ governanceGuardId: address });
  } catch (e) {
    // console.error('AzoriusFreezeGuard:AzoriusFreezeGuardSetUp', e);
  }
});
