import { relations } from "drizzle-orm";
import { dao } from "./onchain";
import { proposals } from "./offchain/proposals";
import { sessions } from "./offchain/sessions";
import { reactions } from "./offchain/reactions";
import { temperatureChecks } from "./offchain/temperatureChecks";
import { comments } from "./offchain/comments";

export const proposalRelations = relations(proposals, ({ one }) => ({
  dao: one(dao, {
    fields: [proposals.dao],
    references: [dao.address],
  }),
}));

export const schema = {
  comments,
  dao,
  proposals,
  reactions,
  temperatureChecks,
  sessions,
};
