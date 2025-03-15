import { integer, text, boolean, pgSchema } from "drizzle-orm/pg-core";
import { onchainSchema } from "./common";

// copy of onchain schema from @decent-ponder/ponder.schema.ts
// TODO: remove this once we have a way to sync the schema
export const daos = onchainSchema.table("daos", {
  slug: text("dao").primaryKey(),
  daoName: text(),
  proposalTemplatesCID: text(),
  snapshotENS: text(),
  subDaoOf: text(),
  topHatId: text(),
  hatIdToStreamId: text(),
  gaslessVotingEnabled: boolean(),
  createdAt: integer(),
  updatedAt: integer(),
}); 
