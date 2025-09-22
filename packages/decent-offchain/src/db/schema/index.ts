import { relations } from 'drizzle-orm';
import * as onchainSchema from './onchain';
import { sessionTable } from './offchain/sessions';
import { safeProposalTable } from './offchain/safeProposals';
import { blockTimestampTable } from './offchain/blockTimestamp';
import { ipfsTable } from './offchain/ipfs';
import { kycTable } from './offchain/kyc';

export type RoleDetails = {
  type: string;
  data: {
    name: string;
    description: string;
  };
};

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

// These relationships link onchain.role with offchain.ipfs entries for cached role details
export const roleIpfsRelations = relations(onchainSchema.roleTable, ({ one }) => ({
  detailsCache: one(ipfsTable, {
    fields: [onchainSchema.roleTable.detailsCID],
    references: [ipfsTable.cid],
  }),
}));

export const ipfsRoleRelations = relations(ipfsTable, ({ many }) => ({
  roles: many(onchainSchema.roleTable),
}));
// ==============================================================================

export const schema = {
  ...onchainSchema,
  // offchain tables
  safeProposalTable,
  sessionTable,
  blockTimestampTable,
  ipfsTable,
  kycTable,
  // offchain relationships
  onchainProposalBlockTimestampRelations,
  blockTimestampTableRelations,
  roleIpfsRelations,
  ipfsRoleRelations,
};

export type DbProposal = onchainSchema.DbOnchainProposal & {
  blockTimestamp?: { timestamp: number } | null;
};
export type DbRole = onchainSchema.DbRole & {
  detailsCache?: { data: RoleDetails } | null;
};
