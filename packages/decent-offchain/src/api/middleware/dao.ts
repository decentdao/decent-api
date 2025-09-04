import { Context, Next } from 'hono';
import { Address, isAddress } from 'viem';
import { inArray } from 'drizzle-orm';
import { Dao } from 'decent-sdk';
import { db } from '@/db';
import {
  CHILD_SELECT_FIELDS,
  DAO_GOVERNANCE_MODULE_JOIN_CONDITION,
  DEFAULT_DAO_WITH,
} from '@/db/queries';
import { ApiError } from '@/api/utils/responseFormatter';
import { formatDao } from '@/api/utils/typeConverter';
import { DbDao } from '@/db/schema/onchain';
import { getChainId } from '@/api/utils/chains';
import { getSafeInfo } from '@/lib/safe';
import { BasicSafeInfo } from '@/lib/safe/types';
import { schema } from '@/db/schema';

const MAX_SUB_DAO_DEPTH = 3;

async function fetchNestedSubDaos(
  addresses: Address[],
  chainId: number,
  depth = 0,
): Promise<BasicDaoInfo[]> {
  if (depth > MAX_SUB_DAO_DEPTH || addresses.length === 0) return [];

  const subDaos = await db
    .select(CHILD_SELECT_FIELDS)
    .from(schema.daoTable)
    .leftJoin(schema.governanceModuleTable, DAO_GOVERNANCE_MODULE_JOIN_CONDITION)
    .where(inArray(schema.daoTable.address, addresses));

  const result = await Promise.all(
    subDaos.map(async (dao) => {
      const nestedSubDaos =
        dao.subDaoAddresses && dao.subDaoAddresses.length > 0
          ? await fetchNestedSubDaos(dao.subDaoAddresses, chainId, depth + 1)
          : [];

      return {
        address: dao.address as Address,
        name: dao.name,
        isAzorius: dao.isAzorius,
        ...(nestedSubDaos.length > 0 && { subDaos: nestedSubDaos }),
      };
    })
  );

  return result;
}

export type BasicDaoInfo = {
  address: Address;
  name: string | null;
  isAzorius: boolean;
  subDaos?: BasicDaoInfo[];
};

declare module 'hono' {
  interface ContextVariableMap {
    dao: Dao & {
      safe: BasicSafeInfo;
      subDaos: BasicDaoInfo[];
    }; // @TODO: update SDK types
  }
}

export const daoCheck = async (c: Context, next: Next) => {
  const { chainId, address } = c.req.param();
  const chainIdNumber = getChainId(chainId);

  const addressLower = address?.toLowerCase();
  if (!addressLower || !isAddress(addressLower)) throw new ApiError('Invalid dao address', 400);

  const dao = (await db.query.daoTable.findFirst({
    where: (dao, { eq, and }) => and(eq(dao.chainId, chainIdNumber), eq(dao.address, addressLower)),
    with: DEFAULT_DAO_WITH,
  })) as DbDao | undefined;

  const subDaos = dao?.subDaoAddresses
    ? await fetchNestedSubDaos(dao.subDaoAddresses, chainIdNumber)
    : [];

  if (!dao) throw new ApiError('DAO not found', 404);

  // get most safe info with contract read
  const safeInfo = await getSafeInfo(chainIdNumber, addressLower);

  c.set('dao', formatDao(dao, safeInfo, subDaos));
  await next();
};
