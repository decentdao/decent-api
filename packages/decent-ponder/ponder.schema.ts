import {
  onchainTable,
  text,
  hex,
  bigint,
  boolean,
  integer,
  primaryKey,
  relations,
  onchainEnum,
  json,
} from 'ponder';

// ================================
// ========= Tables ===============
// ================================
export const dao = onchainTable(
  'dao',
  {
    chainId: integer('dao_chain_id').notNull(),
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
    creatorAddress: hex(),
    erc20Address: hex(),
    createdAt: bigint(),
    updatedAt: bigint(),
  },
  t => ({ pk: primaryKey({ columns: [t.chainId, t.address] }) }),
);

export const moduleType = onchainEnum('module_type', ['AZORIUS', 'FRACTAL']);
export const governanceModule = onchainTable('governance_module', {
  address: hex('governance_module_address').primaryKey(),
  daoChainId: integer(),
  daoAddress: hex(),
  executionPeriod: integer(),
  timelockPeriod: integer(),
  moduleType: moduleType().default('AZORIUS'),
});

export const votingStrategy = onchainTable('voting_strategy', {
  address: hex('voting_strategy_address').primaryKey(),
  governanceModuleId: hex(), // references governanceModule.address
  requiredProposerWeight: bigint(),
  votingPeriod: integer(),
  basisNumerator: bigint(),
  quorumNumerator: bigint(),
});

export const governanceGuard = onchainTable('governance_guard', {
  address: hex('governance_guard_address').primaryKey(),
  daoChainId: integer(),
  daoAddress: hex(),
  executionPeriod: integer(),
  timelockPeriod: integer(),
});

export const freezeVoteType = onchainEnum('freeze_vote_type', ['MULTISIG', 'ERC20', 'ERC721']);
export const freezeVotingStrategy = onchainTable('voting_strategy_freeze', {
  address: hex('voting_strategy_address').primaryKey(),
  governanceGuardId: hex(), // references governanceGuard.address
  freezePeriod: integer(),
  freezeProposalPeriod: integer(),
  freezeVotesThreshold: bigint(),
  freezeVoteType: freezeVoteType(),
});

export const tokenType = onchainEnum('token_type', ['ERC20', 'ERC721']);
export const votingToken = onchainTable(
  'voting_token',
  {
    address: hex('voting_token_address').notNull(),
    votingStrategyId: hex().notNull(), // references votingStrategy.address
    type: tokenType().notNull(),
    weight: bigint(), // ERC721 has weight
  },
  t => ({ pk: primaryKey({ columns: [t.address, t.votingStrategyId] }) }),
);

export const stream = onchainTable(
  'stream',
  {
    streamId: bigint(),
    hatId: text(),
    chainId: integer(),
    sender: hex(),
    smartAccount: hex(),
    asset: hex(),
    amount: bigint(),
    start: integer(),
    cliff: integer(),
    end: integer(),
    cancelable: boolean(),
    transferable: boolean(),
  },
  t => ({ pk: primaryKey({ columns: [t.streamId, t.chainId] }) }),
);

export const role = onchainTable(
  'role',
  {
    hatId: text().notNull(),
    daoChainId: integer().notNull(),
    daoAddress: hex().notNull(),
    detailsCID: text(),
    wearerAddress: hex(),
    eligibility: hex(),
  },
  t => ({ pk: primaryKey({ columns: [t.hatId, t.daoChainId] }) }),
);

export const roleTerm = onchainTable(
  'role_term',
  {
    eligibility: hex().notNull(),
    termEnd: bigint().notNull(),
    wearerAddress: hex(),
  },
  t => ({ pk: primaryKey({ columns: [t.eligibility, t.termEnd] }) }),
);

export const proposal = onchainTable(
  'proposal',
  {
    id: bigint('proposal_id').notNull(),
    daoChainId: integer().notNull(),
    daoAddress: hex().notNull(),
    proposer: hex().notNull(),
    votingStrategyAddress: hex().notNull(),
    transactions: json(),
    title: text().notNull(),
    description: text().notNull(),
    snapshotBlock: integer(),
    createdAt: bigint().notNull(),
    votingEndBlock: integer(),
    proposedTxHash: hex().notNull(),
    executedTxHash: hex(),
  },
  t => ({ pk: primaryKey({ columns: [t.id, t.daoChainId, t.daoAddress] }) }),
);

export const vote = onchainTable(
  'vote',
  {
    voter: hex().notNull(),
    proposalId: bigint().notNull(),
    votingStrategyAddress: hex().notNull(),
    voteType: integer().notNull(), // ['NO', 'YES', 'ABSTAIN']
    weight: bigint().notNull(),
    votedAt: bigint().notNull(),
  },
  t => ({ pk: primaryKey({ columns: [t.voter, t.proposalId, t.votingStrategyAddress] }) }),
);

export const splitWallet = onchainTable(
  'split_wallet',
  {
    address: hex('split_address').notNull(),
    daoChainId: integer().notNull(),
    daoAddress: hex().notNull(),
    name: text(), // comes from a KeyValuePair event
    splits: json()
      .$type<
        {
          address: string;
          percentage: number;
        }[]
      >()
      .notNull(),
    createdAt: bigint().notNull(),
    updatedAt: bigint(),
  },
  t => ({ pk: primaryKey({ columns: [t.address, t.daoChainId, t.daoAddress] }) }),
);

// ================================
// ========= Relations ============
// ================================
export const daoRelations = relations(dao, ({ many }) => ({
  governanceModules: many(governanceModule),
  proposals: many(proposal),
  splitWallets: many(splitWallet),
  roles: many(role),
}));

export const governanceModuleRelations = relations(governanceModule, ({ one, many }) => ({
  dao: one(dao, {
    fields: [governanceModule.daoChainId, governanceModule.daoAddress],
    references: [dao.chainId, dao.address],
  }),
  votingStrategies: many(votingStrategy),
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

export const proposalRelations = relations(proposal, ({ one }) => ({
  dao: one(dao, {
    fields: [proposal.daoChainId, proposal.daoAddress],
    references: [dao.chainId, dao.address],
  }),
}));

export const splitWalletRelations = relations(splitWallet, ({ one }) => ({
  dao: one(dao, {
    fields: [splitWallet.daoChainId, splitWallet.daoAddress],
    references: [dao.chainId, dao.address],
  }),
}));

export const streamRelations = relations(stream, ({ one }) => ({
  role: one(role, {
    fields: [stream.hatId, stream.chainId],
    references: [role.hatId, role.daoChainId],
  }),
}));

export const roleRelations = relations(role, ({ one, many }) => ({
  dao: one(dao, {
    fields: [role.daoChainId, role.daoAddress],
    references: [dao.chainId, dao.address],
  }),
  streams: many(stream),
  terms: many(roleTerm),
}));

export const roleTermRelations = relations(roleTerm, ({ one }) => ({
  role: one(role, {
    fields: [roleTerm.eligibility],
    references: [role.eligibility],
  }),
}));

// ================================
// ========== Types ===============
// ================================
export type Dao = typeof dao.$inferSelect;
export type DaoInsert = typeof dao.$inferInsert;
export type GovernanceModule = typeof governanceModule.$inferSelect;
export type GovernanceModuleInsert = typeof governanceModule.$inferInsert;
export type VotingStrategy = typeof votingStrategy.$inferSelect;
export type VotingStrategyInsert = typeof votingStrategy.$inferInsert;
export type VotingToken = typeof votingToken.$inferSelect;
export type VotingTokenInsert = typeof votingToken.$inferInsert;
export type Stream = typeof stream.$inferSelect;
export type StreamInsert = typeof stream.$inferInsert;
export type Role = typeof role.$inferSelect;
export type RoleInsert = typeof role.$inferInsert;
export type RoleTerm = typeof roleTerm.$inferSelect;
export type RoleTermInsert = typeof roleTerm.$inferInsert;
export type SplitWallet = typeof splitWallet.$inferSelect;
export type SplitWalletInsert = typeof splitWallet.$inferInsert;
