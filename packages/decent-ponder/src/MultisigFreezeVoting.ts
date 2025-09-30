import { ponder } from 'ponder:registry';
import { freezeVotingStrategy } from 'ponder:schema';

ponder.on('MultisigFreezeVoting:MultisigFreezeVotingSetup', async ({ event, context }) => {
  try {
    const address = event.log.address;
    await context.db.update(freezeVotingStrategy, { address }).set({ freezeVoteType: 'MULTISIG' });
  } catch (e) {
    console.error('MultisigFreezeVoting:MultisigFreezeVotingSetup', e);
  }
});

ponder.on('MultisigFreezeVoting:FreezePeriodUpdated', async ({ event, context }) => {
  try {
    const { freezePeriod } = event.args;
    const address = event.log.address;
    await context.db
      .insert(freezeVotingStrategy)
      .values({
        address,
        freezePeriod,
      })
      .onConflictDoUpdate({ freezePeriod });
  } catch (e) {
    // console.error('MultisigFreezeVoting:FreezePeriodUpdated', e);
  }
});

ponder.on('MultisigFreezeVoting:FreezeProposalPeriodUpdated', async ({ event, context }) => {
  try {
    const { freezeProposalPeriod } = event.args;
    const address = event.log.address;
    await context.db
      .insert(freezeVotingStrategy)
      .values({
        address,
        freezeProposalPeriod,
      })
      .onConflictDoUpdate({ freezeProposalPeriod });
  } catch (e) {
    // console.error('MultisigFreezeVoting:FreezeProposalPeriodUpdated', e);
  }
});

ponder.on('MultisigFreezeVoting:FreezeVotesThresholdUpdated', async ({ event, context }) => {
  try {
    const { freezeVotesThreshold } = event.args;
    const address = event.log.address;
    await context.db
      .insert(freezeVotingStrategy)
      .values({
        address,
        freezeVotesThreshold,
      })
      .onConflictDoUpdate({ freezeVotesThreshold });
  } catch (e) {
    // console.error('MultisigFreezeVoting:FreezeVotesThresholdUpdated', e);
  }
});
