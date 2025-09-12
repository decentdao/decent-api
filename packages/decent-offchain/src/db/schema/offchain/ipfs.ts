import { json, text, timestamp } from 'drizzle-orm/pg-core';
import { offchainSchema } from './offchain';

export const ipfsTable = offchainSchema.table('ipfs', {
  cid: text('cid').primaryKey(),
  data: json(),
  fetchedAt: timestamp().defaultNow(),
});
