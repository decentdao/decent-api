import { serial, text, timestamp } from "drizzle-orm/pg-core";
import { offchainSchema } from "./schema";

export const proposals = offchainSchema.table("proposals", {
  id: serial("id").primaryKey(),
  title: text("title"),
  body: text("body"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  dao: text("dao"),
});
