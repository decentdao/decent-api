import { isAddress } from 'viem';
import { Context, ponder } from 'ponder:registry';
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
  HatIdToStreamIdInsert
} from 'ponder:schema';

const handleGovernanceData = async (
  entry: DaoInsert,
  context: Context,
  timestamp: bigint,
) => {
  const { address } = entry;

  let governance = null;
  if (true) {
    governance = await fetchGovernance(context, address);
    console.log('--------------------------------');
    console.dir(governance, { depth: null });
    console.log('--------------------------------');
    entry.guardAddress = governance.guard;
    entry.fractalModuleAddress = governance.fractalModuleAddress;
    entry.requiredSignatures = governance.threshold;
  }

  await context.db.insert(dao).values({ ...entry, createdAt: timestamp }).onConflictDoUpdate({
    ...entry,
    updatedAt: timestamp,
  });

  await context.db.insert(governanceModule).values(
    governance.governanceModules
  ).onConflictDoNothing();

  await context.db.insert(votingStrategy).values(
    governance.votingStrategies
  ).onConflictDoNothing();

  await context.db.insert(votingToken).values(
    governance.votingTokens
  ).onConflictDoNothing();

  await context.db.insert(signer).values(
    governance.signers
  ).onConflictDoNothing();

  await context.db.insert(signerToDao).values(
    governance.signerToDaos
  ).onConflictDoNothing();
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

  await handleGovernanceData(entry, context, event.block.timestamp);
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
