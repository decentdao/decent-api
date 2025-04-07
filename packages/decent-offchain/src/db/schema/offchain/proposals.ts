import { nanoid } from 'nanoid';
import { integer, json, text, timestamp, index } from 'drizzle-orm/pg-core';
import { offchainSchema } from './offchain';
import { hex } from '../hex';

export const proposalTable = offchainSchema.table('proposals', {
  daoChainId: integer().notNull(),
  daoAddress: hex().notNull(),
  slug: text().primaryKey().unique().$defaultFn(() => nanoid()),
  title: text(),
  body: text(),
  status: text(),
  authorAddress: hex().notNull(),
  metadataCID: text(),
  id: integer(), // number to concat with organization prefix (ex: DCT-1)
  safeNonce: integer(),
  executedTxHash: text(),
  votingStrategyAddress: hex(),
  voteStartsAt: timestamp(),
  voteEndsAt: timestamp(),
  discussionId: text(),
  version: integer().default(1),
  cycle: integer(),
  voteType: text(),
  voteChoices: json().$type<string[]>(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp(),
}, (t) => [
  index().on(t.daoChainId, t.daoAddress),
  index().on(t.authorAddress),
]);
