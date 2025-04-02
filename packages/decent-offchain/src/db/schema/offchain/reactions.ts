import { nanoid } from 'nanoid';
import { text, timestamp, index } from 'drizzle-orm/pg-core';
import { offchainSchema } from './offchain';
import { hex } from '../hex';

export const reactions = offchainSchema.table('reactions', {
  id: text().primaryKey().unique().$defaultFn(() => nanoid()),
  authorAddress: hex().notNull(),
  commentId: text(),
  reaction: text().notNull(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp(),
}, (t) => [
  index().on(t.commentId),
]);
