import { integer, text, primaryKey, json } from 'drizzle-orm/pg-core';
import { offchainSchema } from './offchain';
import { hex } from '../hex';

export const safeProposalTable = offchainSchema.table(
  'safe_proposals',
  {
    daoChainId: integer().notNull(),
    daoAddress: hex().notNull(),
    safeNonce: integer().notNull(),
    title: text(),
    body: text(),
    proposer: hex().notNull(),
    metadataCID: text(),
    transactions: json('transactions'),
    executedTxHash: hex(),
    dataDecoded: json('data_decoded'),
  },
  t => [primaryKey({ columns: [t.daoChainId, t.daoAddress, t.safeNonce] })],
);
