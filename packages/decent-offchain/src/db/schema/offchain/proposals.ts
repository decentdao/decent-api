import { nanoid } from 'nanoid';
import { integer, json, text, timestamp, index } from 'drizzle-orm/pg-core';
import { offchainSchema } from './offchain';
import { hex } from '../hex';

export const proposalTable = offchainSchema.table('proposals', {
  slug: text().primaryKey().unique().$defaultFn(() => nanoid()),
  daoChainId: integer().notNull(),
  daoAddress: hex().notNull(),
  authorAddress: hex().notNull(),
  status: text(),
  cycle: integer(),
  id: integer(), // number to concat with organization prefix (ex: DCT-1)
  safeTxHash: text(),
  title: text(),
  body: text(),
  version: integer().default(1),
  voteType: text(),
  voteChoices: json().$type<string[]>(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp(),
}, (t) => [
  index().on(t.daoChainId, t.daoAddress),
  index().on(t.authorAddress),
]);
