import { pgSchema, serial, text, timestamp } from "drizzle-orm/pg-core";

export const offchainSchema = pgSchema("offchain");

export const proposals = offchainSchema.table("proposals", {
  id: serial("id").primaryKey(),
  title: text("title"),
  body: text("body"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  dao: text("dao"),
});
