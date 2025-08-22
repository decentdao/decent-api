import { isAddress } from 'viem';
import { Context, ponder } from 'ponder:registry';
import { fetchSafeInfo } from './utils/safeInfo';
import { hatIdToTreeId } from './utils/hats';
import {
  dao,
  DaoInsert,
  signer,
  signerToDao,
  stream,
  splitWallet,
  StreamInsert,
} from 'ponder:schema';

const handleDataEntry = async (entry: DaoInsert, context: Context, timestamp: bigint) => {
  let newDao = true;
  await context.db
    .insert(dao)
    .values({
      ...entry,
      createdAt: timestamp,
    })
    .onConflictDoUpdate(() => {
      newDao = false;
      const { chainId, address, ...rest } = entry;
      return {
        ...rest,
        updatedAt: timestamp,
      };
    });

  if (newDao) {
    const { address, chainId } = entry;
    const safeInfo = await fetchSafeInfo(context, address);

    // if theres no safeInfo, its not a safe, delete
    if (!safeInfo) {
      await context.db.delete(dao, { address, chainId });
      return;
    }

    await context.db.update(dao, { address, chainId }).set({
      requiredSignatures: safeInfo.threshold,
    });

    if (safeInfo.signers.length > 0) {
      await context.db.insert(signer).values(safeInfo.signers).onConflictDoNothing();
    }

    if (safeInfo.signerToDaos.length > 0) {
      await context.db.insert(signerToDao).values(safeInfo.signerToDaos).onConflictDoNothing();
    }
  }
};

// KeyValuePairs is a generic key value store for Decent
// Subgraph: https://github.com/decentdao/decent-subgraph/blob/main/src/key-value-pairs.ts
// Contract: https://github.com/decentdao/decent-contracts/blob/develop/contracts/singletons/KeyValuePairs.sol
ponder.on('KeyValuePairs:ValueUpdated', async ({ event, context }) => {
  const { theAddress: safeAddress, key, value } = event.args;
  const chainId = context.chain.id;
  const entry: DaoInsert = {
    chainId,
    address: safeAddress,
    creatorAddress: event.transaction.from,
  };

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
    entry.topHatId = value; // can we get rid of this? we may only need treeId
    entry.treeId = hatIdToTreeId(value);
  } else if (key === 'hatIdToStreamId') {
    const [hatId, streamIdString] = value.split(':');
    if (!streamIdString) return;
    const streamId = BigInt(streamIdString);
    await context.db
      .insert(stream)
      .values({
        hatId,
        streamId,
        chainId,
      })
      .onConflictDoUpdate({
        hatId,
      });
    return;
  } else if (key === 'gaslessVotingEnabled') {
    entry.gasTankEnabled = value === 'true';
  } else if (key === 'erc20Address') {
    if (!isAddress(value)) {
      throw new Error(`Invalid erc20Address: ${value} for ${safeAddress}`);
    }
    entry.erc20Address = value;
  } else if (key === 'revShareWallets') {
    try {
      // Parse JSON array: ["0x123:WalletA", "0x456:WalletB"]
      const walletPairs = JSON.parse(value) as string[];
      const wallets = walletPairs.map(item => {
        const [address, name] = item.trim().split(':');
        if (!address || !isAddress(address)) {
          throw new Error(`Invalid split address: ${address}`);
        }
        return {
          address,
          daoChainId: chainId,
          daoAddress: safeAddress,
          name,
        };
      });

      // TODO: is there a better way to update multiple?
      for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        if (!wallet) return;
        await context.db
          .update(splitWallet, {
            daoAddress: wallet.daoAddress,
            daoChainId: wallet.daoChainId,
            address: wallet.address,
          })
          .set({ name: wallet.name });
      }
    } catch (e) {
      console.error('Failed to parse revShareWallets:', e);
    }
  } else {
    console.log('--------------------------------');
    console.log('Unknown key:', key);
    console.log('Network:', chainId);
    console.log(`DAO: ${entry.chainId}:${entry.address}`);
    console.log('Value:', value);
    console.log('--------------------------------');
  }

  try {
    await handleDataEntry(entry, context, event.block.timestamp);
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
  };

  await handleDataEntry(entry, context, event.block.timestamp);
});

ponder.on('FractalRegistry:FractalSubDAODeclared', async ({ event, context }) => {
  const { parentDAOAddress, subDAOAddress } = event.args;
  const entry: DaoInsert = {
    chainId: context.chain.id,
    address: subDAOAddress,
    subDaoOf: parentDAOAddress,
  };

  await handleDataEntry(entry, context, event.block.timestamp);
});
