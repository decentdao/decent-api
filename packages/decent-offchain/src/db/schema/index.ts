import { relations } from 'drizzle-orm';
import * as onchainSchema from './onchain';
import { proposalTable } from './offchain/proposals';
import { sessionTable } from './offchain/sessions';
import { temperatureCheckTable } from './offchain/temperatureChecks';
import { commentTable } from './offchain/comments';

const proposalRelations = relations(proposalTable, ({ one }) => ({
  dao: one(onchainSchema.daoTable, {
    fields: [proposalTable.daoChainId, proposalTable.daoAddress],
    references: [onchainSchema.daoTable.chainId, onchainSchema.daoTable.address],
  }),
}));

const commentRelations = relations(commentTable, ({ one }) => ({
  proposal: one(proposalTable, {
    fields: [commentTable.proposalSlug],
    references: [proposalTable.slug],
  }),
}));

const temperatureCheckRelations = relations(temperatureCheckTable, ({ one }) => ({
  proposal: one(proposalTable, {
    fields: [temperatureCheckTable.proposalSlug],
    references: [proposalTable.slug],
  }),
}));

export const schema = {
  ...onchainSchema,
  proposalTable,
  commentTable,
  temperatureCheckTable,
  sessionTable,
  proposalRelations,
  commentRelations,
  temperatureCheckRelations,
};

export type DbProposal = typeof proposalTable.$inferSelect;
export type DbNewProposal = typeof proposalTable.$inferInsert;
export type DbComment = typeof commentTable.$inferSelect;
export type DbNewComment = typeof commentTable.$inferInsert;
export type DbTemperatureCheck = typeof temperatureCheckTable.$inferSelect;
export type DbNewTemperatureCheck = typeof temperatureCheckTable.$inferInsert;
