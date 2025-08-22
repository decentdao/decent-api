import { ponder } from 'ponder:registry';
import { stream, dao } from 'ponder:schema';

ponder.on('SablierV2LockupLinear:CreateLockupLinearStream', async ({ event, context }) => {
  try {
    const { streamId, recipient, amounts, asset, cancelable, transferable, timestamps, sender } =
      event.args;

    const chainId = context.chain.id;
    const daoExists = await context.db.find(dao, { chainId, address: sender });

    if (!daoExists) return;

    const { start, cliff, end } = timestamps;
    const { deposit } = amounts;

    await context.db.insert(stream).values({
      streamId,
      chainId,
      sender,
      smartAccount: recipient,
      asset,
      amount: deposit,
      start,
      cliff,
      end: BigInt(end),
      cancelable,
      transferable,
    });
  } catch (e) {
    // no log
  }
});
