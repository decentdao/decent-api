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
  createdAt: t.integer(),
  updatedAt: t.integer(),
}));
