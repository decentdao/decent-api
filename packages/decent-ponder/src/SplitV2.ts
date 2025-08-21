import { ponder } from 'ponder:registry';
import { dao, splitWallet } from 'ponder:schema';
import { SplitV2Abi } from '../abis/SplitV2Abi';

// 100.0000 % scaled for Splits, we only work with whole numbers for now
const TOTAL_ALLOCATION_PERCENT = 1_000_000;

function allocationToPercent(allocation: bigint): number {
  return (Number(allocation) / TOTAL_ALLOCATION_PERCENT) * 100;
}

ponder.on('SplitV2:SplitUpdated', async ({ event, context }) => {
  try {
    const { _split } = event.args;
    const address = event.log.address;
    const daoChainId = context.chain.id;
    const timestamp = event.block.timestamp;
    const { recipients, allocations } = _split;
    if (recipients.length !== allocations.length) return;

    const daoAddress = await context.client.readContract({
      address,
      abi: SplitV2Abi,
      functionName: 'owner',
    });

    const daoExists = await context.db.find(dao, {
      address: daoAddress,
      chainId: daoChainId,
    });

    if (!daoExists) return;

    const splits = _split.recipients.map((recipient, index) => {
      const allocation = _split.allocations[index];
      if (!allocation) throw new Error(`Allocation length mismatch for recipient ${recipient}`);
      return {
        address: recipient,
        percentage: allocationToPercent(allocation),
      };
    });

    await context.db
      .insert(splitWallet)
      .values({
        daoAddress,
        daoChainId,
        address,
        splits,
        createdAt: timestamp,
      })
      .onConflictDoUpdate({
        splits,
        updatedAt: timestamp,
      });
  } catch (e) {
    console.error('SplitV2:SplitUpdated', e);
  }
});
