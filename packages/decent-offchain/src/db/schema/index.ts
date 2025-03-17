import { relations } from "drizzle-orm";
import { proposals } from "./proposals";
import { daos } from "./daos";
import { sessions } from "./sessions";

export const proposalRelations = relations(proposals, ({ one }) => ({
  dao: one(daos, {
    fields: [proposals.dao],
    references: [daos.slug],
  }),
}));

export const schema = {
  daos,
  proposals,
  sessions,
};
