import { relations } from 'drizzle-orm';
import * as onchainSchema from './onchain'
import { proposalTable } from './offchain/proposals';
import { sessionTable } from './offchain/sessions';
import { reactions } from './offchain/reactions';
import { temperatureChecks } from './offchain/temperatureChecks';
import { comments } from './offchain/comments';

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
  sessionTable,
  proposalRelations,
};

export type DbProposal = typeof proposalTable.$inferSelect;
export type DbNewProposal = typeof proposalTable.$inferInsert;
export type DbComment = typeof comments.$inferSelect;
export type DbNewComment = typeof comments.$inferInsert;
export type DbReaction = typeof reactions.$inferSelect;
export type DbNewReaction = typeof reactions.$inferInsert;
export type DbTemperatureCheck = typeof temperatureChecks.$inferSelect;
export type DbNewTemperatureCheck = typeof temperatureChecks.$inferInsert;
