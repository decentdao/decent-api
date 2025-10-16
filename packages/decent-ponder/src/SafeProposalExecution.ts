import { IndexingFunctionArgs, ponder } from 'ponder:registry';
import { dao, safeProposalExecution } from 'ponder:schema';

async function executionSuccessHandler({
  event,
  context,
}: IndexingFunctionArgs<'SafeKeyValuePair:ExecutionSuccess'>) {
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
}

ponder.on('SafeKeyValuePair:ExecutionSuccess', executionSuccessHandler);
ponder.on('SafeFractalRegistry:ExecutionSuccess', executionSuccessHandler);
