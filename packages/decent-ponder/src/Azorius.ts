import { replaceBigInts } from 'ponder';
import { ponder } from 'ponder:registry';
import { dao, governanceModule, proposal, votingStrategy, votingToken, vote, votingToken } from 'ponder:schema';
import { AzoriusAbi } from '../abis/AzoriusAbi';
import { deleteProposalEndBlock, getProposalEndBlock } from './utils/endBlock';

ponder.on('Azorius:EnabledStrategy', async ({ event, context }) => {
  try {
    const address = event.log.address;
    const daoAddress = await context.client.readContract({
      address,
      abi: AzoriusAbi,
      functionName: 'target',
    });
    const daoChainId = context.chain.id;
    await context.db
      .insert(governanceModule)
      .values({
        address,
        daoAddress,
        daoChainId,
      })
      .onConflictDoUpdate({ daoAddress, daoChainId });

    await context.db
      .insert(dao)
      .values({
        address: daoAddress,
        chainId: daoChainId,
        isAzorius: true,
      })
      .onConflictDoUpdate({ isAzorius: true });

  } catch (e) {
    console.error('Azorius:EnabledStrategy', e);
  }
});

ponder.on('Azorius:DisabledStrategy', async ({ event, context }) => {
  try {
    const { strategy } = event.args;
    await context.db.delete(votingStrategy, { address: strategy });
  } catch (e) {
    console.error('Azorius:DisabledStrategy', e);
  }
});

ponder.on('Azorius:ExecutionPeriodUpdated', async ({ event, context }) => {
  try {
    const { executionPeriod } = event.args;
    const address = event.log.address;
    await context.db.update(governanceModule, { address }).set({ executionPeriod });
  } catch (e) {
    console.error('Azorius:ExecutionPeriodUpdated', e);
  }
});

ponder.on('Azorius:TimelockPeriodUpdated', async ({ event, context }) => {
  try {
    const { timelockPeriod } = event.args;
    const address = event.log.address;
    await context.db.update(governanceModule, { address }).set({ timelockPeriod });
  } catch (e) {
    console.error('Azorius:TimelockPeriodUpdated', e);
  }
});

ponder.on('Azorius:ProposalCreated', async ({ event, context }) => {
  try {
    const { proposalId, proposer, transactions, metadata, strategy } = event.args;
    const azorius = event.transaction.to;
    if (!azorius) return;

    const moduleQuery = await context.db.find(governanceModule, { address: azorius });
    if (!moduleQuery) return;
    const daoAddress = moduleQuery.daoAddress;
    if (!daoAddress) return;

    const votingEndBlock = getProposalEndBlock(event);

    const { title, description } = JSON.parse(metadata);
    await context.db
      .insert(proposal)
      .values({
        id: proposalId,
        daoChainId: context.chain.id,
        daoAddress,
        proposer,
        votingStrategyAddress: strategy,
        transactions: replaceBigInts(transactions, x => x.toString()),
        title,
        description,
        snapshotBlock: Number(event.block.number),
        createdAt: event.block.timestamp,
        votingEndBlock,
        proposedTxHash: event.transaction.hash,
      })
      .onConflictDoNothing();

    deleteProposalEndBlock(event);
  } catch (e) {
    console.log('Azorius:ProposalCreated', e);
  }
});

ponder.on('Azorius:ProposalExecuted', async ({ event, context }) => {
  try {
    const { proposalId } = event.args;
    const azorius = event.transaction.to;
    if (!azorius) return;

    const moduleQuery = await context.db.find(governanceModule, { address: azorius });
    if (!moduleQuery) return;
    const daoAddress = moduleQuery.daoAddress;
    if (!daoAddress) return;

    await context.db
      .update(proposal, {
        id: BigInt(proposalId),
        daoAddress,
        daoChainId: context.chain.id,
      })
      .set({
        executedTxHash: event.transaction.hash,
      });
  } catch (e) {
    console.log('Azorius:ProposalExecuted', e);
  }
});
