import {
  pgSchema,
  integer,
  text,
  boolean,
  bigint,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { hex } from './hex';

// ================================
// ========= Tables ===============
// ================================
const onchainSchema = pgSchema('onchain');
export const daoTable = onchainSchema.table('dao', {
  chainId:                integer('dao_chain_id').notNull(),
  address:                hex('dao_address').notNull(),
  name:                   text('dao_name'),
  proposalTemplatesCID:   text(),
  snapshotENS:            text(),
  subDaoOf:               text(),
  topHatId:               text(),
  hatIdToStreamId:        text(),
  gasTankEnabled:         boolean(),
  gasTankAddress:         hex(),
  requiredSignatures:     integer(),
  guardAddress:           hex(),
  fractalModuleAddress:   hex(),
  createdAt:              bigint('created_at', { mode: 'number' }),
  updatedAt:              bigint('updated_at', { mode: 'number' }),
},(t) => [
  primaryKey({ columns: [t.chainId, t.address] })
]
);

export const governanceModuleTable = onchainSchema.table('governance_module', {
  address:      hex('governance_module_address').primaryKey(),
  daoChainId:   integer('dao_chain_id').notNull(),
  daoAddress:   hex('dao_address').notNull(),
  name:         text('governance_module_name'),
  description:  text('governance_module_description'),
});

export const votingStrategyTable = onchainSchema.table('voting_strategy', {
  address:            hex('voting_strategy_address').primaryKey(),
  governanceModuleId: hex('governance_module_id').notNull(), // references governanceModule.address
  minProposerBalance: text('min_proposer_balance'),
  name:               text('voting_strategy_name'),
  description:        text('voting_strategy_description'),
  enabledAt:          bigint('voting_strategy_enabled_at', { mode: 'number' }),
  disabledAt:         bigint('voting_strategy_disabled_at', { mode: 'number' }),
});

export const tokenTypeEnum = onchainSchema.enum('token_type', ['ERC20', 'ERC721', 'ERC1155']);
export const votingTokenTable = onchainSchema.table('voting_token', {
  address:          hex('voting_token_address').primaryKey(),
  votingStrategyId: hex('voting_strategy_id').notNull(), // references votingStrategy.address
  type:             tokenTypeEnum('type').notNull(),
});

export const signerTable = onchainSchema.table('signer', {
  address:  hex('signer_address').primaryKey(),
  label:    text('signer_label'),
});

export const signerToDaoTable = onchainSchema.table('signer_to_dao', {
  address:          hex('std_signer_address').notNull(),
  daoChainId:       integer('std_dao_chain_id').notNull(),
  daoAddress:       hex('std_dao_address').notNull(),
},(t) => [
  primaryKey({ columns: [t.address, t.daoChainId, t.daoAddress] })
]);

// ================================
// ========= Relations ============
// ================================
export const daoTableRelations = relations(daoTable, ({ many }) => ({
  governanceModules: many(governanceModuleTable),
  signers: many(signerToDaoTable),
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
}));

export const votingTokenTableRelations = relations(votingTokenTable, ({ one }) => ({
  votingStrategy: one(votingStrategyTable, {
    fields: [votingTokenTable.votingStrategyId],
    references: [votingStrategyTable.address],
  }),
}));

// ================================
// ========== Types ===============
// ================================
export type Dao = typeof daoTable.$inferSelect;
export type GovernanceModule = typeof governanceModuleTable.$inferSelect;
export type VotingStrategy = typeof votingStrategyTable.$inferSelect;
export type VotingToken = typeof votingTokenTable.$inferSelect;
export type Signer = typeof signerTable.$inferSelect;
export type SignerToDao = typeof signerToDaoTable.$inferSelect;
