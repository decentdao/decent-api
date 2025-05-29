import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { schema } from '@/db/schema';
import resf, { ApiError } from '@/api/utils/responseFormatter';

const app = new Hono();

/**
 * @title Get the number of proposals that an address has submitted
 * @route GET /points/proposals
 * @param {string} address - Address parameter
 * @param {boolean} passed - Whether to filter for passed proposals
 * @returns {address, proposalCount} - The address and the number of proposals that the address has submitted
 */
app.get('/proposals', async c => {
  const _address = c.req.query('address');
  if (!_address) throw new ApiError('Address is required', 400);
  const passed = c.req.query('passed') === 'true';
  const address = _address?.toLowerCase() as `0x${string}`;
  const [onchainProposals, safeProposals] = await Promise.all([
    db.query.onchainProposalTable.findMany({
      where: passed
        ? sql`LOWER(${schema.onchainProposalTable.proposer}) = ${address} AND ${schema.onchainProposalTable.executedTxHash} IS NOT NULL`
        : sql`LOWER(${schema.onchainProposalTable.proposer}) = ${address}`,
    }),
    db.query.safeProposalTable.findMany({
      where: passed
        ? sql`LOWER(${schema.safeProposalTable.proposer}) = ${address} AND ${schema.safeProposalTable.executedTxHash} IS NOT NULL`
        : sql`LOWER(${schema.safeProposalTable.proposer}) = ${address}`,
    }),
  ]);
  const proposalCount = onchainProposals.length + safeProposals.length;
  return resf(c, { address, proposalCount });
});

export default app;
