import { ponder } from 'ponder:registry';
import { freezeVotingStrategy, governanceGuard, safeProposalExecution } from 'ponder:schema';

ponder.on('MultisigFreezeGuard:MultisigFreezeGuardSetup', async ({ event, context }) => {
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
    // console.error('MultisigFreezeGuard:MultisigFreezeGuardSetup', e);
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

// Need to track when a subDAO Safe proposal is timelocked
ponder.on('MultisigFreezeGuard:TransactionTimelocked', async ({ event, context }) => {
  const { transactionHash: safeTxnHash } = event.args;
  const guardAddress = event.log.address;
  const freezeGuard = await context.db.find(governanceGuard, { address: guardAddress });
  if (!freezeGuard) return; // not in our database
  const { daoAddress, daoChainId } = freezeGuard;

  // update Safe proposal with timelockedBlock
  const timelockedBlock = Number(event.block.number);
  await context.db
    .insert(safeProposalExecution)
    .values({
      daoChainId,
      daoAddress,
      safeTxnHash,
      timelockedBlock,
    })
    .onConflictDoUpdate({ timelockedBlock });
});
