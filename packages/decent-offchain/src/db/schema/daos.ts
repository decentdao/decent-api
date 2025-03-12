import { varchar, text, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { offchainSchema } from "./common";

export const daos = offchainSchema.table('daos', {
  chain: varchar("chain").notNull(),
  address: varchar("address").notNull(),
  daoName: text("dao_name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  primaryKey({
    name: "slug",
    columns: [table.chain, table.address]
  })
]);
