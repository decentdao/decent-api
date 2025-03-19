import { nanoid } from "nanoid";
import { integer, json, text, timestamp, index } from "drizzle-orm/pg-core";
import { offchainSchema } from "./offchain";

export const proposals = offchainSchema.table("proposals", {
  slug: text().primaryKey().unique().default(nanoid()),
  dao: text().notNull(),
  authorAddress: text().notNull(),
  status: text(),
  cycle: integer(),
  id: integer(), // number to concat with organization prefix (ex: DCT-1)
  safeTxHash: text(),
  title: text(),
  body: text(),
  voteType: text(),
  voteChoices: json().$type<string[]>(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp(),
}, (t) => [
  index().on(t.dao),
  index().on(t.authorAddress),
]);
