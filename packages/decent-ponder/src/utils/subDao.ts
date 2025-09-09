import { Context } from 'ponder:registry';
import { dao } from 'ponder:schema';

export async function updateSubDaoAddresses(
  context: Context,
  chainId: number,
  daoAddress: `0x${string}`,
  subDaoAddress: `0x${string}`,
  timestamp: bigint,
) {
  try {
    const parentDAO = await context.db.find(dao, { chainId, address: daoAddress });
    const currentSubDaoAddresses = parentDAO?.subDaoAddresses || [];
    const subDaoAddresses = [...currentSubDaoAddresses, subDaoAddress];
    await context.db.update(dao, { chainId, address: daoAddress }).set({
      subDaoAddresses,
      updatedAt: timestamp,
    });
  } catch {}
}
