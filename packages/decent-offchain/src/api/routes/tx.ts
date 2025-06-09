import { Hono } from 'hono';
import { daoCheck } from '@/api/middleware/dao';
import resf, { ApiError } from '@/api/utils/responseFormatter';
import { formatTx } from '@/api/utils/decodeTxData';
import { Address } from 'viem';
import { Transaction } from '@/db/schema/onchain';

const app = new Hono();

/**
 * @title Decode proposal transaction data
 * @route GET /d/{chainId}/{address}/tx/{target}/{value}/{data}
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @param {string} target - target of the transaction
 * @param {string} value - value of the transaction
 * @param {string} data - data of the transaction
 * @returns {string} 'ok'
 */
app.get('/:target/:value/:data', daoCheck, async c => {
  const { target, value, data } = c.req.param();
  if (!target || !value || !data) throw new ApiError('Transaction parameters are required', 400);
  if (!target.startsWith('0x')) throw new ApiError('Target must be a valid address', 400);
  if (isNaN(Number(value))) throw new ApiError('Value must be a valid number', 400);
  if (!data.startsWith('0x')) throw new ApiError('Data must be a valid hex string', 400);

  const dao = c.get('dao');

  if (!dao) throw new ApiError('DAO not found', 404);

  const tx: Transaction = {
    to: target as Address,
    value: BigInt(value),
    data: data as `0x${string}`,
    operation: 0,
  };

  const decoded = await formatTx(tx, dao.chainId);
  return resf(c, decoded);
});

export default app;
