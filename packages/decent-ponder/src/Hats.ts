import { and, eq } from 'ponder';
import { ponder } from 'ponder:registry';
import { dao, role } from 'ponder:schema';
import { hatIdToTreeId, checkAdminHat } from './utils/hats';

ponder.on('Hats:HatCreated', async ({ event, context }) => {
  try {
    const { id, details, eligibility } = event.args;
    const isAdminHat = checkAdminHat(id);
    if (isAdminHat) return;

    const chainId = context.chain.id;
    const treeId = hatIdToTreeId(id);
    const daoByTreeId = await context.db.sql
      .select({
        address: dao.address,
        chainId: dao.chainId,
      })
      .from(dao)
      .where(and(eq(dao.chainId, chainId), eq(dao.treeId, treeId)))
      .limit(1);

    if (daoByTreeId) {
      const dao = daoByTreeId[0];
      if (!dao) return;
      const detailsCID = details.split('ipfs://')[1];

      await context.db.insert(role).values({
        hatId: String(id),
        daoChainId: dao.chainId,
        daoAddress: dao.address,
        detailsCID,
        eligibility,
      });
    }
  } catch (e) {
    console.error('Hats:HatCreated');
  }
});

ponder.on('Hats:TransferSingle', async ({ context, event }) => {
  try {
    const { id, to } = event.args;
    const hatId = String(id);
    const wearerAddress = to;
    const daoChainId = context.chain.id;
    await context.db
      .update(role, {
        daoChainId,
        hatId,
      })
      .set({
        wearerAddress,
      });
  } catch (e) {
    console.error('Hats:TransferSingle');
  }
});
