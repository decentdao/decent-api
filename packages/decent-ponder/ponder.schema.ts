import { onchainTable } from "ponder";

export const keyValuePair = onchainTable("keyValuePair", (t) => ({
  dao: t.text().primaryKey(),
  daoName: t.text(),
  proposalTemplatesCID: t.text(),
  snapshotENS: t.text(),
  createdAt: t.integer(),
  updatedAt: t.integer(),
}));
