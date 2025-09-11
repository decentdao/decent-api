import { integer, primaryKey } from 'drizzle-orm/pg-core';
import { SupportedChainId } from 'decent-sdk';
import { offchainSchema } from './offchain';

export const blockTimestampTable = offchainSchema.table(
  'block_timestamp',
  {
    chainId: integer().notNull().$type<SupportedChainId>(),
    blockNumber: integer().notNull(),
    timestamp: integer(),
    updatedAt: integer().notNull(),
  },
  t => [primaryKey({ columns: [t.chainId, t.blockNumber] })],
);
