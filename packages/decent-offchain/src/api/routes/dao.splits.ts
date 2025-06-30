import { Hono } from 'hono';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { schema } from '@/db/schema';
import { daoCheck } from '@/api/middleware/dao';
import resf from '@/api/utils/responseFormatter';

const app = new Hono();

/**
 * @title Get all splits for a DAO
 * @route GET /d/{chainId}/{address}/splits
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @returns {Split[]} Array of split objects
 */
app.get('/', daoCheck, async c => {
  const dao = c.get('dao');

  // Fetch split groups together with their recipients
  const splits = await db.query.splitTable.findMany({
    where: and(
      eq(schema.splitTable.daoChainId, dao.chainId),
      eq(schema.splitTable.daoAddress, dao.address),
    ),
    with: {
      recipients: {
        columns: {
          recipientAddress: true,
          percentage: true,
        },
      },
    },
  });

  const formatted = splits.map(s => ({
    address: s.address,
    name: s.name,
    splits: s.recipients.map(r => ({
      address: r.recipientAddress,
      percentage: r.percentage,
    })),
  }));

  return resf(c, formatted);
});

export default app;
