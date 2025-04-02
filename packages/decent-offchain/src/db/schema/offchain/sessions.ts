import { index, text, timestamp } from 'drizzle-orm/pg-core';
import { offchainSchema } from './offchain';
import { hex } from '../hex';
export const sessions = offchainSchema.table('sessions', {
  id: text().primaryKey(),
  nonce: text().notNull(),
  address: hex(),
  ensName: text(),
  signature: text(),
  createdAt: timestamp().defaultNow(),
}, (t) => [
  index().on(t.address),
]);
