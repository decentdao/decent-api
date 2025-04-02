import { relations } from "drizzle-orm";
import * as onchainSchema from "./onchain"
import { proposalTable } from "./offchain/proposals";
import { sessions } from "./offchain/sessions";
import { reactions } from "./offchain/reactions";
import { temperatureChecks } from "./offchain/temperatureChecks";
import { comments } from "./offchain/comments";

const proposalRelations = relations(proposalTable, ({ one }) => ({
  dao: one(onchainSchema.daoTable, {
    fields: [proposalTable.daoChainId, proposalTable.daoAddress],
    references: [onchainSchema.daoTable.chainId, onchainSchema.daoTable.address],
  }),
}));

export const schema = {
  ...onchainSchema,
  comments,
  proposalTable,
  reactions,
  temperatureChecks,
  sessions,
  proposalRelations,
};

export type Proposal = typeof proposalTable.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Reaction = typeof reactions.$inferSelect;
export type TemperatureCheck = typeof temperatureChecks.$inferSelect;
export type Session = typeof sessions.$inferSelect;
