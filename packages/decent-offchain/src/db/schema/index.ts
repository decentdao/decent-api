import { relations } from "drizzle-orm";
import * as onchainSchema from "./onchain"
import { proposals } from "./offchain/proposals";
import { sessions } from "./offchain/sessions";
import { reactions } from "./offchain/reactions";
import { temperatureChecks } from "./offchain/temperatureChecks";
import { comments } from "./offchain/comments";

const proposalRelations = relations(proposals, ({ one }) => ({
  dao: one(onchainSchema.daoTable, {
    fields: [proposals.daoChainId, proposals.daoAddress],
    references: [onchainSchema.daoTable.chainId, onchainSchema.daoTable.address],
  }),
}));

export const schema = {
  ...onchainSchema,
  comments,
  proposals,
  reactions,
  temperatureChecks,
  sessions,
  proposalRelations,
};
