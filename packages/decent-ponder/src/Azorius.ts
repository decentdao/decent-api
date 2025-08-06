import { replaceBigInts } from 'ponder';
import { ponder } from 'ponder:registry';
import { governanceModule, proposal } from 'ponder:schema';
import { AzoriusAbi } from '../abis/Azorius';

ponder.on('Azorius:EnabledStrategy', async ({ event, context }) => {
  try {
    const address = event.log.address;
    const daoAddress = await context.client.readContract({
      address,
      abi: AzoriusAbi,
      functionName: 'target'
    });
    const daoChainId = context.chain.id;
    await context.db.insert(governanceModule).values({
      address,
      daoAddress,
      daoChainId
    }).onConflictDoUpdate({ daoAddress, daoChainId });
  } catch (e) {
    console.error('Azorius:EnabledStrategy', e);
  }
});

ponder.on('Azorius:ExecutionPeriodUpdated', async ({ event, context }) => {
  try {
    const { executionPeriod } = event.args;
    const address = event.log.address;
    await context.db.update(
      governanceModule, { address }
    ).set({ executionPeriod});
  } catch (e) {
    console.error('Azorius:ExecutionPeriodUpdated', e);
  }
});

ponder.on('Azorius:TimelockPeriodUpdated', async ({ event, context }) => {
  try {
    const { timelockPeriod } = event.args;
    const address = event.log.address;
    await context.db.update(
      governanceModule, { address }
    ).set({ timelockPeriod});
  } catch (e) {
    console.error('Azorius:TimelockPeriodUpdated', e);
  }
});

ponder.on('Azorius:ProposalCreated', async ({ event, context }) => {
  try {
    const { proposalId, proposer, transactions, metadata, strategy } = event.args;
    if (!event.transaction.to) return;
    const daoAddress = await context.client.readContract({
      address: event.transaction.to,
      abi: AzoriusAbi,
      functionName: 'target',
    });
    const { title, description } = JSON.parse(metadata);
    await context.db.insert(proposal).values({
      id: proposalId,
      daoChainId: context.chain.id,
      daoAddress,
      proposer,
      votingStrategyAddress: strategy,
      transactions: replaceBigInts(transactions, (x) => x.toString()),
      title,
      description,
      createdAt: event.block.timestamp,
      proposedTxHash: event.transaction.hash,
    }).onConflictDoNothing();
  } catch (e) {
    console.log('Azorius:ProposalCreated', e);
  }
});

ponder.on('Azorius:ProposalExecuted', async ({ event, context }) => {
  try {
    const { proposalId } = event.args;
    if (!event.transaction.to) return;
    const daoAddress = await context.client.readContract({
      address: event.transaction.to,
      abi: AzoriusAbi,
      functionName: 'target'
    });
    await context.db.update(proposal, {
      id: BigInt(proposalId),
      daoAddress,
      daoChainId: context.chain.id,
    }).set({
      executedTxHash: event.transaction.hash,
    });
  } catch (e) {
    console.log('Azorius:ProposalExecuted', e);
  }
});
