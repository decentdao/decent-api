import { isAddress } from 'viem';
import { Context, ponder } from 'ponder:registry';
import { fetchGovernance } from './fetch';
import {
  dao,
  DaoInsert,
  signer,
  signerToDao,
  hatIdToStreamId,
  HatIdToStreamIdInsert,
} from 'ponder:schema';

// @TODO ENG-1080
// Use ZodiacModuleProxyFactory to get
// initial data Safe and governance modules for the DAO
const handleGovernanceData = async (
  entry: DaoInsert,
  context: Context,
  timestamp: bigint,
) => {
  const { address } = entry;

  let governance = null;
  governance = await fetchGovernance(context, address);
  entry.requiredSignatures = governance.threshold;

  await context.db.insert(dao).values({ ...entry, createdAt: timestamp }).onConflictDoUpdate(() => {
    const { chainId, address, ...rest } = entry;
    return {
      ...rest,
      updatedAt: timestamp,
    }
  });

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
    chainId: context.chain.id,
    address: safeAddress,
  }

  if (key === 'daoName') {
    entry.name = value;
    entry.creatorAddress = event.transaction.from;

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
      daoChainId: context.chain.id,
      daoAddress: safeAddress,
      hatId: hatId,
      streamId: streamId,
    }
    await context.db.insert(hatIdToStreamId).values(hatIdToStreamIdData).onConflictDoNothing();
    return;

  } else if (key === 'gaslessVotingEnabled') {
    entry.gasTankEnabled = value === 'true';

  } else if (key === 'erc20Address') {
    if (!isAddress(value)) {
      throw new Error(`Invalid erc20Address: ${value} for ${safeAddress}`);
    }
    entry.erc20Address = value;

  } else {
    console.log('--------------------------------');
    console.log('Unknown key:', key);
    console.log('Network:', context.chain.id);
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
    chainId: context.chain.id,
    address: daoAddress,
    name: daoName,
    creatorAddress: event.transaction.from,
  }

  await handleGovernanceData(entry, context, event.block.timestamp);
});

ponder.on('FractalRegistry:FractalSubDAODeclared', async ({ event, context }) => {
  const { parentDAOAddress, subDAOAddress } = event.args;
  const entry: DaoInsert = {
    chainId: context.chain.id,
    address: subDAOAddress,
    subDaoOf: parentDAOAddress,
  }

  await handleGovernanceData(entry, context, event.block.timestamp);
});
