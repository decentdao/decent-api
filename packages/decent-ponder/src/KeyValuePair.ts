import { isAddress, parseEventLogs } from 'viem';
import { Context, ponder } from 'ponder:registry';
import { isSafeCheck } from './utils/safeInfo';
import { hatIdToTreeId } from './utils/hats';
import { updateSubDaoAddresses } from './utils/subDao';
import { SablierV2LockupLinearAbi } from '../abis/SablierV2LockupLinearAbi';
import { dao, DaoInsert, stream, splitWallet, tokenSale } from 'ponder:schema';

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

    const isSafe = await isSafeCheck(context, address);

    if (!isSafe) {
      // a non-safe address made it into the systme, remove it
      await context.db.delete(dao, { address, chainId });
      return;
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
  // =======================================================
  if (key === 'daoName') {
    entry.name = value;
    // =======================================================
  } else if (key === 'proposalTemplates') {
    entry.proposalTemplatesCID = value;
    // =======================================================
  } else if (key === 'snapshotENS' || key === 'snapshotURL') {
    const cleanedValue = value === '' ? null : value;
    entry.snapshotENS = cleanedValue;
    // =======================================================
  } else if (key === 'childDao') {
    if (!isAddress(value)) {
      throw new Error(`Invalid childDao: ${value} for ${safeAddress}`);
    }
    entry.address = value;
    entry.subDaoOf = safeAddress;

    await updateSubDaoAddresses(context, chainId, safeAddress, value, event.block.timestamp);
    // =======================================================
  } else if (key === 'topHatId') {
    entry.topHatId = value; // can we get rid of this? we may only need treeId
    entry.treeId = hatIdToTreeId(value);
    // =======================================================
  } else if (key === 'hatIdToStreamId') {
    const [hatId, streamIdString] = value.split(':');
    if (!streamIdString) return;
    const kvStreamId = BigInt(streamIdString);

    // SablierV2LockupLinear:CreateLockupLinearStream has over 100k events
    // it does not make sense to use ponder.on(...) so we will fetch the CreateLockupLinearStream
    // from the logs
    const { logs } = await context.client.getTransactionReceipt({
      hash: event.transaction.hash,
    });

    const parsedLogs = parseEventLogs({
      abi: SablierV2LockupLinearAbi,
      eventName: 'CreateLockupLinearStream',
      logs,
    });

    // Multiple SablierV2LockupLinear:CreateLockupLinearStream can exists in a single transaction
    const createStream = parsedLogs.find(c => c.args.streamId === kvStreamId);

    if (!createStream) return;

    const { streamId, recipient, amounts, asset, cancelable, transferable, timestamps, sender } =
      createStream.args;

    const { deposit } = amounts;
    const { start, cliff, end } = timestamps;

    await context.db.insert(stream).values({
      hatId,
      streamId,
      chainId,
      sender,
      smartAccount: recipient,
      asset,
      amount: deposit,
      start,
      cliff,
      end,
      cancelable,
      transferable,
    });
    return;
    // =======================================================
  } else if (key === 'gaslessVotingEnabled') {
    entry.gasTankEnabled = value === 'true';
    // =======================================================
  } else if (key === 'erc20Address') {
    if (!isAddress(value)) {
      throw new Error(`Invalid erc20Address: ${value} for ${safeAddress}`);
    }
    entry.erc20Address = value;
    // =======================================================
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
    // =======================================================
  } else if (key === 'newtokensale') {
    try {
      const { tokenSaleAddress, tokenSaleName, ...tokenSaleRequirements } = JSON.parse(value);
      await context.db.insert(tokenSale).values({
        daoChainId: chainId,
        daoAddress: safeAddress,
        tokenSaleAddress,
        tokenSaleName,
        tokenSaleRequirements,
      });
    } catch (e) {
      console.error('Failed to parse newtokensale:', e);
    }
    // =======================================================
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
  const chainId = context.chain.id;
  const entry: DaoInsert = {
    chainId,
    address: subDAOAddress,
    subDaoOf: parentDAOAddress,
  };

  await handleDataEntry(entry, context, event.block.timestamp);

  await updateSubDaoAddresses(
    context,
    chainId,
    parentDAOAddress,
    subDAOAddress,
    event.block.timestamp,
  );
});
