import * as onchainSchema from './onchain';
import { sessionTable } from './offchain/sessions';
import { safeProposalTable } from './offchain/safeProposals';
import { blockTimestampTable } from './offchain/blockTimestamp';
import { ipfsTable } from './offchain/ipfs';
import { relations } from 'drizzle-orm';

// These relationships link onchain.proposal with offchain.blockTimestamp entries
export const onchainProposalBlockTimestampRelations = relations(
  onchainSchema.onchainProposalTable,
  ({ one }) => ({
    blockTimestamp: one(blockTimestampTable, {
      fields: [
        onchainSchema.onchainProposalTable.daoChainId,
        onchainSchema.onchainProposalTable.votingEndBlock,
      ],
      references: [blockTimestampTable.chainId, blockTimestampTable.blockNumber],
    }),
  }),
);

export const blockTimestampTableRelations = relations(blockTimestampTable, ({ many }) => ({
  proposals: many(onchainSchema.onchainProposalTable),
}));
// ==============================================================================

export const schema = {
  ...onchainSchema,
  // offchain tables
  safeProposalTable,
  sessionTable,
  blockTimestampTable,
  ipfsTable,
  // offchain relationships
  onchainProposalBlockTimestampRelations,
  blockTimestampTableRelations,
};

export type DbNewSafeProposal = typeof safeProposalTable.$inferInsert;
export type DbProposal = onchainSchema.DbOnchainProposal & {
  blockTimestamp?: { timestamp: number } | null;
};
