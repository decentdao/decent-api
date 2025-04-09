import { Context, Next } from 'hono';
import { isAddress } from 'viem';
import { db } from '@/db';
import { DEFAULT_DAO_WITH } from '@/db/queries';
import { ApiError } from '@/api/utils/responseFormatter';
import { Dao } from '@/api/types/Dao';
import { formatDao } from '@/api/utils/typeConverter';
import { DbDao } from '@/db/schema/onchain';

declare module 'hono' {
  interface ContextVariableMap {
    dao: Dao;
  }
}

export const daoCheck = async (c: Context, next: Next) => {
  const { chainId, address } = c.req.param();
  const chainIdNumber = Number(chainId);
  if (isNaN(chainIdNumber)) throw new ApiError('Invalid dao chainId', 400);

  const addressLower = address?.toLowerCase();
  if (!addressLower || !isAddress(addressLower)) throw new ApiError('Invalid dao address', 400);

  const query = await db.query.daoTable.findFirst({
    where: (dao, { eq }) => eq(dao.chainId, chainIdNumber) && eq(dao.address, addressLower),
    with: DEFAULT_DAO_WITH,
  }) as DbDao;

  if (!query) throw new ApiError('DAO not found', 404);

  c.set('dao', formatDao(query));
  await next();
}
