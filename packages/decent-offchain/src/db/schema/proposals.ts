import { nanoid } from "nanoid";
import { integer, json, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { offchainSchema } from "./common";

export const proposals = offchainSchema.table("proposals", {
  slug: varchar().primaryKey().unique().default(nanoid()),
  dao: text().notNull(),
  authorAddress: varchar().notNull(),
  status: varchar(),
  cycle: integer(),
  id: integer(), // number to concat with organization prefix (ex: DCT-1)
  safeTxHash: varchar(),
  title: text(),
  body: text(),
  voteType: varchar(),
  voteChoices: json().$type<string[]>(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
});
