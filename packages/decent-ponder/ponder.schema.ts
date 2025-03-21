import { onchainTable } from "ponder";

export const daos = onchainTable("daos", (t) => ({
  dao: t.text().primaryKey(),
  daoName: t.text(),
  proposalTemplatesCID: t.text(),
  snapshotENS: t.text(),
  subDaoOf: t.text(),
  topHatId: t.text(),
  hatIdToStreamId: t.text(),
  gaslessVotingEnabled: t.boolean(),
  azoriusModuleAddress: t.text(),
  votingStrategyAddress: t.text(),
  votingTokenType: t.text(),
  votingTokenAddress: t.json(),
  signers: t.json(),
  requiredSignatures: t.integer(),
  createdAt: t.integer(),
  updatedAt: t.integer(),
}));

export type Dao = typeof daos.$inferSelect;
export type DaoInsert = typeof daos.$inferInsert;
