import { relations } from "drizzle-orm";
import { proposals } from "./proposals";
import { daos } from "./daos";

export const proposalRelations = relations(proposals, ({ one }) => ({
  dao: one(daos, {
    fields: [proposals.dao],
    references: [daos.slug],
  }),
}));

export const schema = {
  daos,
  proposals,
};
