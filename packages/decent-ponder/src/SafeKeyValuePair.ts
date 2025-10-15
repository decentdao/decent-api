// This file should be almost same as SafeFractalRegistry.ts
//   except for contract index name.
import { ponder } from 'ponder:registry';
import { dao, governanceGuard, safeProposalExecution } from 'ponder:schema';

ponder.on('SafeKeyValuePair:ExecutionSuccess', async ({ event, context }) => {
  const { txHash: safeTxnHash } = event.args;
  const daoAddress = event.log.address;
  const daoChainId = context.chain.id;
  const executedTxHash = event.transaction.hash;
  const executedBlock = Number(event.block.number);

  const daoExists = await context.db.find(dao, {
    address: daoAddress,
    chainId: daoChainId,
  });

  // Do not need to record for Azorius based
  if (!daoExists || daoExists.isAzorius) return;

  await context.db
    .insert(safeProposalExecution)
    .values({
      daoChainId,
      daoAddress,
      safeTxnHash,
      executedTxHash,
      executedBlock,
    })
    .onConflictDoUpdate({ executedTxHash });
});

ponder.on('SafeKeyValuePair:ChangedGuard', async ({ event, context }) => {
  const { guard } = event.args;
  const daoAddress = event.log.address;
  const daoChainId = context.chain.id;

  const daoExists = await context.db.find(dao, {
    address: daoAddress,
    chainId: daoChainId,
  });

  if (!daoExists) return;

  await context.db
    .insert(governanceGuard)
    .values({
      address: guard,
      daoAddress,
      daoChainId,
    })
    .onConflictDoUpdate({
      daoAddress,
      daoChainId,
    });
});
