import { pgSchema, integer, text, boolean, bigint, primaryKey, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { Address } from 'viem';
import { SupportedChainId } from 'decent-sdk';
import { hex } from './hex';
import { TokenSaleRequirements } from '@/lib/requirements/types';

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
    isAzorius: boolean().default(false).notNull(),
    subDaoOf: hex(),
    subDaoAddresses: hex().array(),
    treeId: integer(),
    topHatId: text(),
    gasTankEnabled: boolean(),
    gasTankAddress: hex(),
    creatorAddress: hex().notNull(),
    erc20Address: hex(),
    createdAt: bigint({ mode: 'number' }),
    updatedAt: bigint({ mode: 'number' }),
  },
  t => [primaryKey({ columns: [t.chainId, t.address] })],
);

export const moduleType = onchainSchema.enum('module_type', ['AZORIUS', 'FRACTAL']);
export const governanceModuleTable = onchainSchema.table('governance_module', {
  address: hex('governance_module_address').primaryKey(),
  daoChainId: integer().notNull().$type<SupportedChainId>(),
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

export const governanceGuardTable = onchainSchema.table('governance_guard', {
  address: hex('governance_guard_address').primaryKey(),
  daoChainId: integer().notNull().$type<SupportedChainId>(),
  daoAddress: hex().notNull(),
  executionPeriod: integer(),
  timelockPeriod: integer(),
});

export const safeProposalExecutionTable = onchainSchema.table(
  'safe_proposal_execution',
  {
    daoChainId: integer().notNull().$type<SupportedChainId>(),
    daoAddress: hex().notNull(),
    safeTxnHash: hex().notNull(),
    executedTxHash: hex(),
    timelockedBlock: integer(),
    executedBlock: integer(),
  },
  t => ({ pk: primaryKey({ columns: [t.daoChainId, t.daoAddress, t.safeTxnHash] }) }),
);

export const freezeVoteType = onchainSchema.enum('freeze_vote_type', [
  'MULTISIG',
  'ERC20',
  'ERC721',
]);
export const freezeVotingStrategyTable = onchainSchema.table('voting_strategy_freeze', {
  address: hex('voting_strategy_address').primaryKey(),
  governanceGuardId: hex(), // references governanceGuard.address
  freezePeriod: integer(),
  freezeProposalPeriod: integer(),
  freezeVotesThreshold: bigint({ mode: 'number' }),
  freezeVoteType: freezeVoteType(),
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

export const streamTable = onchainSchema.table(
  'stream',
  {
    streamId: bigint({ mode: 'number' }).notNull(),
    hatId: text(),
    chainId: integer().notNull().$type<SupportedChainId>(),
    sender: hex(),
    smartAccount: hex(),
    asset: hex(),
    amount: bigint({ mode: 'number' }),
    start: integer(),
    cliff: integer(),
    end: integer(),
    cancelable: boolean(),
    transferable: boolean(),
  },
  t => [primaryKey({ columns: [t.streamId, t.chainId] })],
);

export const roleTable = onchainSchema.table(
  'role',
  {
    hatId: text().notNull(),
    daoChainId: integer().notNull().$type<SupportedChainId>(),
    daoAddress: hex().notNull(),
    detailsCID: text(),
    wearerAddress: hex(),
    eligibility: hex(),
  },
  t => [primaryKey({ columns: [t.hatId, t.daoChainId] })],
);

export const roleTermTable = onchainSchema.table(
  'role_term',
  {
    eligibility: hex().notNull(),
    termEnd: bigint({ mode: 'number' }).notNull(),
    wearerAddress: hex(),
  },
  t => [primaryKey({ columns: [t.eligibility, t.termEnd] })],
);

export const onchainProposalTable = onchainSchema.table(
  'proposal',
  {
    id: bigint('proposal_id', { mode: 'number' }).notNull(),
    daoChainId: integer().notNull().$type<SupportedChainId>(),
    daoAddress: hex().notNull(),
    proposer: hex().notNull(),
    votingStrategyAddress: hex().notNull(),
    transactions: json().$type<Transaction[]>(),
    title: text().notNull(),
    description: text().notNull(),
    snapshotBlock: integer().notNull(),
    createdAt: bigint({ mode: 'number' }).notNull(),
    votingEndBlock: integer(),
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
    votedAt: bigint({ mode: 'number' }),
  },
  t => [primaryKey({ columns: [t.voter, t.proposalId, t.votingStrategyAddress] })],
);

export const splitWalletTable = onchainSchema.table(
  'split_wallet',
  {
    address: hex('split_address').notNull(),
    daoChainId: integer('dao_chain_id').notNull().$type<SupportedChainId>(),
    daoAddress: hex('dao_address').notNull(),
    name: text(), // comes from a KeyValuePair event
    splits: json().$type<Split[]>().notNull(),
    createdAt: bigint({ mode: 'number' }).notNull(),
    updatedAt: bigint({ mode: 'number' }),
  },
  t => [primaryKey({ columns: [t.address, t.daoChainId, t.daoAddress] })],
);

export const tokenSaleTable = onchainSchema.table('token_sale', {
  tokenSaleAddress: hex().primaryKey(),
  daoChainId: integer().notNull().$type<SupportedChainId>(),
  daoAddress: hex().notNull(),
  tokenSaleName: text(),
  tokenSaleRequirements: json().$type<TokenSaleRequirements>().notNull(),
});

// ================================
// ========= Relations ============
// ================================
export const daoTableRelations = relations(daoTable, ({ many }) => ({
  governanceModules: many(governanceModuleTable),
  governanceGuards: many(governanceGuardTable),
  proposals: many(onchainProposalTable),
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

export const governanceGuardTableRelations = relations(governanceGuardTable, ({ one, many }) => ({
  dao: one(daoTable, {
    fields: [governanceGuardTable.daoChainId, governanceGuardTable.daoAddress],
    references: [daoTable.chainId, daoTable.address],
  }),
  freezeVotingStrategies: many(freezeVotingStrategyTable),
}));

export const freezeVotingStrategyTableRelations = relations(
  freezeVotingStrategyTable,
  ({ one }) => ({
    governanceGuard: one(governanceGuardTable, {
      fields: [freezeVotingStrategyTable.governanceGuardId],
      references: [governanceGuardTable.address],
    }),
  }),
);

export const streamTableRelations = relations(streamTable, ({ one }) => ({
  role: one(roleTable, {
    fields: [streamTable.hatId, streamTable.chainId],
    references: [roleTable.hatId, roleTable.daoChainId],
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

export const roleTableRelations = relations(roleTable, ({ one, many }) => ({
  dao: one(daoTable, {
    fields: [roleTable.daoChainId, roleTable.daoAddress],
    references: [daoTable.chainId, daoTable.address],
  }),
  streams: many(streamTable),
  terms: many(roleTermTable),
}));

export const roleTermTableRelations = relations(roleTermTable, ({ one }) => ({
  role: one(roleTable, {
    fields: [roleTermTable.eligibility],
    references: [roleTable.eligibility],
  }),
}));

// ================================
// ========== Types ===============
// ================================
export type DbDao = typeof daoTable.$inferSelect & {
  governanceModules: DbGovernanceModule[];
  governanceGuards?: DbGovernanceGuard[];
  roles: DbRole[];
};
export type DbGovernanceModule = typeof governanceModuleTable.$inferSelect & {
  votingStrategies: DbVotingStrategy[];
};
export type DbGovernanceGuard = typeof governanceGuardTable.$inferSelect & {
  freezeVotingStrategies?: DbFreezeVotingStrategy[];
};
export type DbFreezeVotingStrategy = typeof freezeVotingStrategyTable.$inferSelect;
export type DbVotingStrategy = typeof votingStrategyTable.$inferSelect & {
  votingTokens: DbVotingToken[];
};
export type DbVotingToken = typeof votingTokenTable.$inferSelect;
export type DbStream = typeof streamTable.$inferSelect;
export type DbOnchainProposal = typeof onchainProposalTable.$inferSelect & {
  votes?: DbVote[];
};
export type DbVote = typeof voteTable.$inferSelect;
export type SplitWallet = typeof splitWalletTable.$inferSelect;
export type DbRoleTerm = typeof roleTermTable.$inferSelect;
export type DbRole = typeof roleTable.$inferSelect & {
  streams?: DbStream[];
  terms?: DbRoleTerm[];
};
