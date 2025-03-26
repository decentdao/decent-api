import { onchainTable, primaryKey, relations } from "ponder";

export const dao = onchainTable("dao", (t) => ({
  chainId:              t.integer("dao_chain_id").notNull(),
  address:              t.hex("dao_address").notNull(),
  name:                 t.text("dao_name"),
  proposalTemplatesCID: t.text(),
  snapshotENS:          t.text(),
  subDaoOf:             t.text(),
  topHatId:             t.text(),
  hatIdToStreamId:      t.text(),
  gasTankEnabled:       t.boolean(),
  gasTankAddress:       t.hex(),
  governanceModule:     t.text(),
  votingStrategy:       t.text(),
  signers:              t.text(),
  requiredSignatures:   t.integer(),
  guardAddress:         t.hex(),
  fractalAddress:       t.hex(),
  createdAt:            t.bigint(),
  updatedAt:            t.bigint(),
}),
  (t) => ({
    pk: primaryKey({ columns: [t.chainId, t.address] }),
  }),
);

export const daoRelations = relations(dao, ({ many }) => ({
  signers: many(signerToDao),
}));

export const governanceModule = onchainTable("governance_module", (t) => ({
  address:      t.hex("governance_module_address").primaryKey(),
  name:         t.text("governance_module_name"),
  description:  t.text("governance_module_description"),
}));

export const votingStrategy = onchainTable("voting_strategy", (t) => ({
  address:      t.hex("voting_strategy_address").primaryKey(),
  votingToken:  t.text("voting_token"),
  version:      t.text("voting_strategy_version"),
  name:         t.text("voting_strategy_name"),
  description:  t.text("voting_strategy_description"),
  enabledAt:    t.bigint("voting_strategy_enabled_at"),
  disabledAt:   t.bigint("voting_strategy_disabled_at"),
}));

export const votingToken = onchainTable("voting_token", (t) => ({
  addresses:    t.hex("voting_token_addresses").array().primaryKey(), // ERC721 can have multiple addresses so we need an array
  type:         t.text("voting_token_type").$type<"ERC20" | "ERC721" | "ERC1155">(),
}));

export const signer = onchainTable("signer", (t) => ({
  address:  t.hex("signer_address").primaryKey(),
  label:    t.text("signer_label"),
}));

export const signerRelations = relations(signer, ({ many }) => ({
  daos: many(signerToDao),
}));

export const signerToDao = onchainTable("signer_to_dao", (t) => ({
  id:         t.hex("signer_to_dao_id").primaryKey(),
  address:    t.hex("signer_to_dao_address").notNull(),
  daoChainId: t.integer("dao_chain_id").notNull(),
  daoAddress: t.hex("dao_address").notNull(),
}));

export const signerDaoRelations = relations(signerToDao, ({ one }) => ({
  signer:   one(signer, { fields: [signerToDao.address], references: [signer.address] }),
  dao:      one(dao, { fields: [signerToDao.daoChainId, signerToDao.daoAddress], references: [dao.chainId, dao.address] }),
}));

export type Dao = typeof dao.$inferSelect;
export type DaoInsert = typeof dao.$inferInsert;
export type GovernanceModule = typeof governanceModule.$inferSelect;
export type GovernanceModuleInsert = typeof governanceModule.$inferInsert;
export type VotingStrategy = typeof votingStrategy.$inferSelect;
export type VotingStrategyInsert = typeof votingStrategy.$inferInsert;
export type VotingToken = typeof votingToken.$inferSelect;
export type VotingTokenInsert = typeof votingToken.$inferInsert;
