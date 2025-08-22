import { pgSchema, integer, text, boolean, bigint, primaryKey, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { Address } from 'viem';
import { SupportedChainId } from 'decent-sdk';
import { hex } from './hex';

export type Transaction = {
  to: Address;
  value: bigint;
  data: string;
  operation: number;
};

export type Split = {
  address: Address;
  percentage: number;
};

// ================================
// ========= Tables ===============
// ================================
export const onchainSchema = pgSchema('onchain');
export const daoTable = onchainSchema.table(
  'dao',
  {
    chainId: integer('dao_chain_id').notNull().$type<SupportedChainId>(),
    address: hex('dao_address').notNull(),
    name: text('dao_name'),
    proposalTemplatesCID: text(),
    snapshotENS: text(),
    subDaoOf: hex(),
    treeId: integer(),
    topHatId: text(),
    gasTankEnabled: boolean(),
    gasTankAddress: hex(),
    creatorAddress: hex(),
    requiredSignatures: integer(),
    erc20Address: hex(),
    createdAt: bigint({ mode: 'number' }),
    updatedAt: bigint({ mode: 'number' }),
  },
  t => [primaryKey({ columns: [t.chainId, t.address] })],
);

export const moduleType = onchainSchema.enum('module_type', ['AZORIUS', 'FRACTAL']);
export const governanceModuleTable = onchainSchema.table('governance_module', {
  address: hex('governance_module_address').primaryKey(),
  daoChainId: integer().notNull(),
  daoAddress: hex().notNull(),
  executionPeriod: bigint({ mode: 'number' }),
  timelockPeriod: bigint({ mode: 'number' }),
  moduleType: moduleType(),
});

export const votingStrategyTable = onchainSchema.table('voting_strategy', {
  address: hex('voting_strategy_address').primaryKey(),
  governanceModuleId: hex(), // references governanceModule.address
  requiredProposerWeight: bigint({ mode: 'number' }),
  votingPeriod: integer(),
  basisNumerator: bigint({ mode: 'number' }),
  quorumNumerator: bigint({ mode: 'number' }),
});

export const freezeVotingStrategy = onchainSchema.table('voting_strategy_freeze', {
  address: hex('voting_strategy_address').primaryKey(),
  governanceModuleId: hex(), // references governanceModule.address
  freezePeriod: integer(),
  freezeProposalPeriod: integer(),
  freezeVotesThreshold: bigint({ mode: 'number' }),
});

export const tokenTypeEnum = onchainSchema.enum('token_type', ['ERC20', 'ERC721']);
export const votingTokenTable = onchainSchema.table(
  'voting_token',
  {
    address: hex('voting_token_address').notNull(),
    votingStrategyId: hex().notNull(), // references votingStrategy.address
    type: tokenTypeEnum().notNull(),
    weight: bigint({ mode: 'number' }), // ERC721 has weight
  },
  t => [primaryKey({ columns: [t.address, t.votingStrategyId] })],
);

export const signerTable = onchainSchema.table('signer', {
  address: hex('signer_address').primaryKey(),
});

export const signerToDaoTable = onchainSchema.table(
  'signer_to_dao',
  {
    address: hex('std_signer_address').notNull(),
    daoChainId: integer('std_dao_chain_id').notNull(),
    daoAddress: hex('std_dao_address').notNull(),
  },
  t => [primaryKey({ columns: [t.address, t.daoChainId, t.daoAddress] })],
);

export const hatIdToStreamIdTable = onchainSchema.table(
  'hat_id_to_stream_id',
  {
    hatId: text().notNull(),
    streamId: text().notNull(),
    daoChainId: integer().notNull(),
    daoAddress: hex().notNull(),
  },
  t => [primaryKey({ columns: [t.hatId, t.streamId] })],
);

export const onchainProposalTable = onchainSchema.table(
  'proposal',
  {
    id: bigint('proposal_id', { mode: 'number' }).notNull(),
    daoChainId: integer().notNull(),
    daoAddress: hex().notNull(),
    proposer: hex().notNull(),
    votingStrategyAddress: hex().notNull(),
    transactions: json().$type<Transaction[]>(),
    title: text().notNull(),
    description: text().notNull(),
    createdAt: bigint({ mode: 'number' }).notNull(),
    proposedTxHash: hex().notNull(),
    executedTxHash: hex(),
  },
  t => [primaryKey({ columns: [t.id, t.daoChainId, t.daoAddress] })],
);

export const voteTable = onchainSchema.table(
  'vote',
  {
    voter: hex().notNull(),
    proposalId: bigint({ mode: 'number' }),
    votingStrategyAddress: hex().notNull(),
    voteType: integer().notNull(), // ['NO', 'YES', 'ABSTAIN']
    weight: bigint({ mode: 'number' }),
    votedAt: text().notNull(),
  },
  t => [primaryKey({ columns: [t.voter, t.proposalId, t.votingStrategyAddress] })],
);

export const splitWalletTable = onchainSchema.table(
  'split_wallet',
  {
    address: hex('split_address').notNull(),
    daoChainId: integer('dao_chain_id').notNull(),
    daoAddress: hex('dao_address').notNull(),
    name: text(), // comes from a KeyValuePair event
    splits: json().$type<Split[]>().notNull(),
    createdAt: bigint({ mode: 'number' }).notNull(),
    updatedAt: bigint({ mode: 'number' }),
  },
  t => [primaryKey({ columns: [t.address, t.daoChainId, t.daoAddress] })],
);

export const roleTable = onchainSchema.table(
  'role',
  {
    hatId: text().notNull(),
    daoChainId: integer().notNull(),
    daoAddress: hex().notNull(),
    detailsCID: text(),
    wearerAddress: hex(),
  },
  t => [primaryKey({ columns: [t.hatId, t.daoChainId] })],
);

// ================================
// ========= Relations ============
// ================================
export const daoTableRelations = relations(daoTable, ({ many }) => ({
  signers: many(signerToDaoTable),
  governanceModules: many(governanceModuleTable),
  hatIdToStreamIds: many(hatIdToStreamIdTable),
  splitWallets: many(splitWalletTable),
  roles: many(roleTable),
}));

export const governanceModuleTableRelations = relations(governanceModuleTable, ({ one, many }) => ({
  dao: one(daoTable, {
    fields: [governanceModuleTable.daoChainId, governanceModuleTable.daoAddress],
    references: [daoTable.chainId, daoTable.address],
  }),
  votingStrategies: many(votingStrategyTable),
}));

export const signerTableRelations = relations(signerTable, ({ many }) => ({
  daos: many(signerToDaoTable),
}));

export const signerToDaoTableRelations = relations(signerToDaoTable, ({ one }) => ({
  signer: one(signerTable, {
    fields: [signerToDaoTable.address],
    references: [signerTable.address],
  }),
  dao: one(daoTable, {
    fields: [signerToDaoTable.daoChainId, signerToDaoTable.daoAddress],
    references: [daoTable.chainId, daoTable.address],
  }),
}));

export const votingStrategyTableRelations = relations(votingStrategyTable, ({ one, many }) => ({
  governanceModule: one(governanceModuleTable, {
    fields: [votingStrategyTable.governanceModuleId],
    references: [governanceModuleTable.address],
  }),
  votingTokens: many(votingTokenTable),
  proposals: many(onchainProposalTable),
  votes: many(voteTable),
}));

export const votingTokenTableRelations = relations(votingTokenTable, ({ one }) => ({
  votingStrategy: one(votingStrategyTable, {
    fields: [votingTokenTable.votingStrategyId],
    references: [votingStrategyTable.address],
  }),
}));

export const hatIdToStreamIdTableRelations = relations(hatIdToStreamIdTable, ({ one }) => ({
  dao: one(daoTable, {
    fields: [hatIdToStreamIdTable.daoChainId, hatIdToStreamIdTable.daoAddress],
    references: [daoTable.chainId, daoTable.address],
  }),
}));

export const onchainProposalTableRelations = relations(onchainProposalTable, ({ one, many }) => ({
  dao: one(daoTable, {
    fields: [onchainProposalTable.daoChainId, onchainProposalTable.daoAddress],
    references: [daoTable.chainId, daoTable.address],
  }),
  votingStrategy: one(votingStrategyTable, {
    fields: [onchainProposalTable.votingStrategyAddress],
    references: [votingStrategyTable.address],
  }),
  votes: many(voteTable),
}));

export const voteTableRelations = relations(voteTable, ({ one }) => ({
  proposal: one(onchainProposalTable, {
    fields: [voteTable.proposalId, voteTable.votingStrategyAddress],
    references: [onchainProposalTable.id, onchainProposalTable.votingStrategyAddress],
  }),
  votingStrategy: one(votingStrategyTable, {
    fields: [voteTable.votingStrategyAddress],
    references: [votingStrategyTable.address],
  }),
}));

export const splitWalletTableRelations = relations(splitWalletTable, ({ one }) => ({
  dao: one(daoTable, {
    fields: [splitWalletTable.daoChainId, splitWalletTable.daoAddress],
    references: [daoTable.chainId, daoTable.address],
  }),
}));

export const roleTableRelations = relations(roleTable, ({ one }) => ({
  dao: one(daoTable, {
    fields: [roleTable.daoChainId, roleTable.daoAddress],
    references: [daoTable.chainId, daoTable.address],
  }),
}));

// ================================
// ========== Types ===============
// ================================
export type DbDao = typeof daoTable.$inferSelect & {
  signers: DbSignerToDao[];
  governanceModules: DbGovernanceModule[];
  hatIdToStreamIds: DbHatIdToStreamId[];
  roles: DbRole[];
};
export type DbGovernanceModule = typeof governanceModuleTable.$inferSelect & {
  votingStrategies: DbVotingStrategy[];
};
export type DbVotingStrategy = typeof votingStrategyTable.$inferSelect & {
  votingTokens: DbVotingToken[];
};
export type DbVotingToken = typeof votingTokenTable.$inferSelect;
export type DbSigner = typeof signerTable.$inferSelect;
export type DbSignerToDao = typeof signerToDaoTable.$inferSelect;
export type DbHatIdToStreamId = typeof hatIdToStreamIdTable.$inferSelect;
export type DbOnchainProposal = typeof onchainProposalTable.$inferSelect & {
  votes?: DbVote[];
};
export type DbVote = typeof voteTable.$inferSelect;
export type SplitWallet = typeof splitWalletTable.$inferSelect;
export type DbRole = typeof roleTable.$inferSelect;
