import { nanoid } from 'nanoid';
import { text, timestamp, index } from 'drizzle-orm/pg-core';
import { offchainSchema } from './offchain';
import { hex } from '../hex';

export const commentTable = offchainSchema.table('comments', {
  id: text().primaryKey().unique().$defaultFn(() => nanoid()),
  replyToId: text(),
  proposalSlug: text(),
  authorAddress: hex().notNull(),
  content: text().notNull(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp(),
}, (t) => [
  index().on(t.proposalSlug),
  index().on(t.replyToId),
  index().on(t.authorAddress),
]);
