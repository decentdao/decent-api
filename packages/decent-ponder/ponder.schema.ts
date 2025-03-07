import { onchainTable } from "ponder";

export const keyValuePair = onchainTable("keyValuePair", (t) => ({
  dao: t.text().primaryKey(),
  chainId: t.text(),
  daoName: t.text(),
  proposalTemplates: t.text(),
  snapshotENS: t.text(),
  createdAt: t.bigint(),
  updatedAt: t.bigint(),
}));
