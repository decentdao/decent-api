import { ponder } from 'ponder:registry';
import { freezeVotingStrategy, governanceGuard } from 'ponder:schema';

ponder.on('MultisigFreezeGuard:MultisigFreezeGuardSetup', async ({ event, context }) => {
  try {
    const { childGnosisSafe, freezeVoting } = event.args;
    const address = event.log.address;
    const daoChainId = context.chain.id;
    await context.db
      .insert(governanceGuard)
      .values({
        address,
        daoAddress: childGnosisSafe,
        daoChainId,
      })
      .onConflictDoUpdate({
        daoAddress: childGnosisSafe,
        daoChainId,
      });

    // got freeze voting info so insert it
    await context.db
      .insert(freezeVotingStrategy)
      .values({
        address: freezeVoting,
        governanceGuardId: address,
      })
      .onConflictDoUpdate({ governanceGuardId: address });
  } catch (e) {
    console.error('MultisigFreezeGuard:MultisigFreezeGuardSetup', e);
  }
});

ponder.on('MultisigFreezeGuard:TimelockPeriodUpdated', async ({ event, context }) => {
  try {
    const address = event.log.address;
    const { timelockPeriod } = event.args;
    await context.db.update(governanceGuard, { address }).set({ timelockPeriod });
  } catch (e) {
    // No error since most of the time this is the intended path to not overwrite non-MultisigFreezeGuard
    // console.error('MultisigFreezeGuard:TimelockPeriodUpdated');
  }
});

ponder.on('MultisigFreezeGuard:ExecutionPeriodUpdated', async ({ event, context }) => {
  try {
    const address = event.log.address;
    const { executionPeriod } = event.args;
    await context.db.update(governanceGuard, { address }).set({ executionPeriod });
  } catch (e) {
    // No error since most of the time this is the intended path to not overwrite non-MultisigFreezeGuard
    // console.error('MultisigFreezeGuard:ExecutionPeriodUpdated');
  }
});
