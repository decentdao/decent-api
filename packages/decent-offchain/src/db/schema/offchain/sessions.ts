import { index, text, timestamp } from "drizzle-orm/pg-core";
import { offchainSchema } from "./offchain";

export const sessions = offchainSchema.table("sessions", {
  id: text().primaryKey(),
  nonce: text().notNull(),
  address: text(),
  ensName: text(),
  signature: text(),
  createdAt: timestamp().defaultNow(),
}, (t) => [
  index().on(t.address),
]);
