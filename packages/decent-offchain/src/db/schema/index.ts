import { relations } from "drizzle-orm";
import { proposals } from "./proposals";
import { dao } from "./onchain";
import { sessions } from "./sessions";

export const proposalRelations = relations(proposals, ({ one }) => ({
  dao: one(dao, {
    fields: [proposals.dao],
    references: [dao.address],
  }),
}));

export const schema = {
  dao,
  proposals,
  sessions,
};
