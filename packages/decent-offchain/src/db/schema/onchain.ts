import {
  pgSchema,
  integer,
  text,
  boolean,
  bigint,
  primaryKey,
  customType
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ================================
// ========= Custom Types =========
// ================================
const hex = customType<{ data: `0x${string}` }>({
  dataType() {
    return "text";
  },
  toDriver(hex) {
    return hex;
  },
  fromDriver(hex) {
    return hex as `0x${string}`;
  },
});

// ================================
// ========= Tables ===============
// ================================
const onchainSchema = pgSchema("onchain");
export const dao = onchainSchema.table("dao", {
    chainId:                integer("dao_chain_id").notNull(),
    address:                hex("dao_address").notNull(),
    name:                   text("dao_name"),
    proposalTemplatesCID:   text(),
    snapshotENS:            text(),
    subDaoOf:               text(),
    topHatId:               text(),
    hatIdToStreamId:        text(),
    gasTankEnabled:         boolean(),
    gasTankAddress:         hex(),
    requiredSignatures:     integer(),
    guardAddress:           hex(),
    fractalAddress:         hex(),
    createdAt:              bigint("created_at", { mode: "number" }),
    updatedAt:              bigint("updated_at", { mode: "number" }),
  },(t) => [
    primaryKey({ columns: [t.chainId, t.address] })
  ]
);

export const governanceModule = onchainSchema.table("governance_module", {
  address:      hex("governance_module_address").primaryKey(),
  daoChainId:   integer("dao_chain_id").notNull(),
  daoAddress:   hex("dao_address").notNull(),
  name:         text("governance_module_name"),
  description:  text("governance_module_description"),
});

export const votingStrategy = onchainSchema.table("voting_strategy", {
  address:            hex("voting_strategy_address").primaryKey(),
  governanceModuleId: hex("governance_module_id").notNull(), // references governanceModule.address
  version:            text("voting_strategy_version"),
  name:               text("voting_strategy_name"),
  description:        text("voting_strategy_description"),
  enabledAt:          bigint("voting_strategy_enabled_at", { mode: "number" }),
  disabledAt:         bigint("voting_strategy_disabled_at", { mode: "number" }),
});

export const tokenType = onchainSchema.enum("token_type", ["ERC20", "ERC721", "ERC1155"]);
export const votingToken = onchainSchema.table("voting_token", {
  address:          hex("voting_token_address").primaryKey(),
  votingStrategyId: hex("voting_strategy_id").notNull(), // references votingStrategy.address
  type:             tokenType("type").notNull(),
});

export const signer = onchainSchema.table("signer", {
  address:  hex("signer_address").primaryKey(),
  label:    text("signer_label"),
});

export const signerToDao = onchainSchema.table("signer_to_dao", {
  id:         text("signer_to_dao_id").primaryKey(),
  address:    hex("signer_to_dao_address").notNull(),
  daoChainId: integer("dao_chain_id").notNull(),
  daoAddress: hex("dao_address").notNull(),
});

// ================================
// ========= Relations ============
// ================================
export const daoRelations = relations(dao, ({ many }) => ({
  signers: many(signerToDao),
  governanceModule: many(governanceModule),
}));

export const governanceModuleRelations = relations(governanceModule, ({ one, many }) => ({
  dao: one(dao, {
    fields: [governanceModule.daoChainId, governanceModule.daoAddress],
    references: [dao.chainId, dao.address],
  }),
  votingStrategies: many(votingStrategy),
}));

export const signerRelations = relations(signer, ({ many }) => ({
  daos: many(signerToDao),
}));

export const signerDaoRelations = relations(signerToDao, ({ one }) => ({
  signer: one(signer, {
    fields: [signerToDao.address],
    references: [signer.address],
  }),
  dao: one(dao, {
    fields: [signerToDao.daoChainId, signerToDao.daoAddress],
    references: [dao.chainId, dao.address],
  }),
}));

export const votingStrategyRelations = relations(votingStrategy, ({ one, many }) => ({
  governanceModule: one(governanceModule, {
    fields: [votingStrategy.governanceModuleId],
    references: [governanceModule.address],
  }),
  votingTokens: many(votingToken),
}));

export const votingTokenRelations = relations(votingToken, ({ one }) => ({
  votingStrategy: one(votingStrategy, {
    fields: [votingToken.votingStrategyId],
    references: [votingStrategy.address],
  }),
}));

// ================================
// ========== Types ===============
// ================================
export type Dao = typeof dao.$inferSelect;
export type GovernanceModule = typeof governanceModule.$inferSelect;
export type VotingStrategy = typeof votingStrategy.$inferSelect;
export type VotingToken = typeof votingToken.$inferSelect;
export type Signer = typeof signer.$inferSelect;
export type SignerToDao = typeof signerToDao.$inferSelect;
