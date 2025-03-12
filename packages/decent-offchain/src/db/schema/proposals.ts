import { nanoid } from "nanoid";
import { integer, json, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { offchainSchema } from "./common";

export const proposals = offchainSchema.table("proposals", {
  slug: varchar("slug").primaryKey().unique().default(nanoid()),
  dao: varchar("dao").notNull(),
  authorAddress: varchar("author_address").notNull(),
  status: varchar("status"),
  cycle: integer("cycle"),
  id: integer("id"), // number to concat with organization prefix (ex: DCT-1)
  safeTxHash: varchar("safe_tx_hash"),
  title: text("title"),
  body: text("body"),
  voteType: varchar("vote_type"),
  voteChoices: json("vote_choices").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
