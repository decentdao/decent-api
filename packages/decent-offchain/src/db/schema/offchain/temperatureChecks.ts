import { nanoid } from "nanoid";
import { text, timestamp, index } from "drizzle-orm/pg-core";
import { offchainSchema } from "./offchain";

export const temperatureChecks = offchainSchema.table("temperatureChecks", {
  id: text().primaryKey().unique().$defaultFn(() => nanoid()),
  proposalId: text().notNull(),
  temperature: text().notNull(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp(),
}, (t) => [
  index().on(t.proposalId),
]);
