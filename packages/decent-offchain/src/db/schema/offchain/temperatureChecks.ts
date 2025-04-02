import { nanoid } from 'nanoid';
import { text, timestamp, index } from 'drizzle-orm/pg-core';
import { offchainSchema } from './offchain';
import { hex } from '../hex';

export const temperatureChecks = offchainSchema.table('temperatureChecks', {
  id: text().primaryKey().unique().$defaultFn(() => nanoid()),
  proposalId: text().notNull(),
  authorAddress: hex().notNull(),
  temperature: text().notNull(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp(),
}, (t) => [
  index().on(t.proposalId),
]);
