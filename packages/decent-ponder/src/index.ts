import { isAddress } from 'viem';
import { Context, ponder } from 'ponder:registry';
import { replaceBigInts } from 'ponder';
import { fetchGovernance } from './fetch';
import {
  dao,
  DaoInsert,
  governanceModule,
  signer,
  signerToDao,
  votingStrategy,
  votingToken,
  hatIdToStreamId,
  HatIdToStreamIdInsert,
  proposal
} from 'ponder:schema';
import { AzoriusAbi } from '../abis/Azorius';
import { parseProposalMetadata } from './utils/parseMetadata';

const handleGovernanceData = async (
  entry: DaoInsert,
  context: Context,
  timestamp: bigint,
) => {
  const { address } = entry;

  let governance = null;
  governance = await fetchGovernance(context, address);
  entry.guardAddress = governance.guard;
  entry.fractalModuleAddress = governance.fractalModuleAddress;
  entry.requiredSignatures = governance.threshold;

  await context.db.insert(dao).values({ ...entry, createdAt: timestamp }).onConflictDoUpdate({
    ...entry,
    updatedAt: timestamp,
  });

  if (governance.governanceModules.length > 0) {
    await context.db.insert(governanceModule).values(
      governance.governanceModules
    ).onConflictDoNothing();
  }

  if (governance.votingStrategies.length > 0) {
    await context.db.insert(votingStrategy).values(
      governance.votingStrategies
    ).onConflictDoNothing();
  }

  if (governance.votingTokens.length > 0) {
    await context.db.insert(votingToken).values(
      governance.votingTokens
    ).onConflictDoNothing();
  }

  if (governance.signers.length > 0) {
    await context.db.insert(signer).values(
      governance.signers
    ).onConflictDoNothing();
  }

  if (governance.signerToDaos.length > 0) {
    await context.db.insert(signerToDao).values(
      governance.signerToDaos
    ).onConflictDoNothing();
  }
};

// KeyValuePairs is a generic key value store for Decent
// Subgraph: https://github.com/decentdao/decent-subgraph/blob/main/src/key-value-pairs.ts
// Contract: https://github.com/decentdao/decent-contracts/blob/develop/contracts/singletons/KeyValuePairs.sol
ponder.on('KeyValuePairs:ValueUpdated', async ({ event, context }) => {
  const { theAddress: safeAddress, key, value } = event.args;
  const entry: DaoInsert = {
    chainId: context.network.chainId,
    address: safeAddress,
  }

  if (key === 'daoName') {
    entry.name = value;

  } else if (key === 'proposalTemplates') {
    entry.proposalTemplatesCID = value;

  } else if (key === 'snapshotENS' || key === 'snapshotURL') {
    const cleanedValue = value === '' ? null : value;
    entry.snapshotENS = cleanedValue;

  } else if (key === 'childDao') {
    if (!isAddress(value)) {
      throw new Error(`Invalid childDao: ${value} for ${safeAddress}`);
    }
    entry.address = value;
    entry.subDaoOf = safeAddress;

  } else if (key === 'topHatId') {
    entry.topHatId = value;

  } else if (key === 'hatIdToStreamId') {
    const [hatId, streamId] = value.split(':');
    const hatIdToStreamIdData: HatIdToStreamIdInsert = {
      daoChainId: context.network.chainId,
      daoAddress: safeAddress,
      hatId: hatId,
      streamId: streamId,
    }
    await context.db.insert(hatIdToStreamId).values(hatIdToStreamIdData).onConflictDoNothing();
    return;

  } else if (key === 'gaslessVotingEnabled') {
    entry.gasTankEnabled = value === 'true';

  } else {
    console.log('--------------------------------');
    console.log('Unknown key:', key);
    console.log('Network:', context.network.chainId);
    console.log(`DAO: ${entry.chainId}:${entry.address}`);
    console.log('Value:', value);
    console.log('--------------------------------');
  }

  try {
    await handleGovernanceData(entry, context, event.block.timestamp);
  } catch (error) {
    console.log('--------------------------------');
    console.log('Error handling governance data:', error);
    console.dir(event, { depth: null });
    console.log('--------------------------------');
  }
});

// Decent used to be called Fractal and used this event to set the dao name
// Subgraph: https://github.com/decentdao/decent-subgraph/blob/main/src/fractal-registry.ts
// Contract: https://github.com/decentdao/decent-contracts/blob/87b74fc69c788709bb606c59e41cf5a365506b06/contracts/FractalRegistry.sol
ponder.on('FractalRegistry:FractalNameUpdated', async ({ event, context }) => {
  const { daoAddress, daoName } = event.args;
  const entry: DaoInsert = {
    chainId: context.network.chainId,
    address: daoAddress,
    name: daoName,
  }

  await handleGovernanceData(entry, context, event.block.timestamp);
});

ponder.on('FractalRegistry:FractalSubDAODeclared', async ({ event, context }) => {
  const { parentDAOAddress, subDAOAddress } = event.args;
  const entry: DaoInsert = {
    chainId: context.network.chainId,
    address: subDAOAddress,
    subDaoOf: parentDAOAddress,
  }

  await handleGovernanceData(entry, context, event.block.timestamp);
});


ponder.on('ZodiacModules:ProposalCreated', async ({ event, context }) => {
  try {
    const { proposalId, proposer, transactions, metadata, strategy } = event.args;
    if (!event.transaction.to) return;
    const daoAddress = await context.client.readContract({
      address: event.transaction.to,
      abi: AzoriusAbi,
      functionName: 'target',
    });
    const { title, description } = parseProposalMetadata(metadata);
    await context.db.insert(proposal).values({
      id: proposalId,
      daoChainId: context.network.chainId,
      daoAddress,
      proposer,
      votingStrategyAddress: strategy,
      transactions: replaceBigInts(transactions, (x) => x.toString()),
      title,
      description,
      createdAt: event.block.timestamp,
      proposedTxHash: event.transaction.hash,
    });
  } catch (error) {
    console.log('assuming not Azorius module, skipping...');
  }
});

ponder.on('ZodiacModules:ProposalExecuted', async ({ event, context }) => {
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
      daoChainId: context.network.chainId,
    }).set({
      executedTxHash: event.transaction.hash,
    });
  } catch (error) {
    console.log('event.transaction.to is not Azorius module, skipping...');
  }
});
