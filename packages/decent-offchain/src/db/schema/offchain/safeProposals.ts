import { integer, text, primaryKey, json, timestamp } from 'drizzle-orm/pg-core';
import { offchainSchema } from './offchain';
import { hex } from '../hex';
import { DataDecoded, SafeMultisigConfirmationResponse } from '@/lib/safe/types';
import { SupportedChainId } from 'decent-sdk';

export const safeProposalTable = offchainSchema.table(
  'safe_proposals',
  {
    daoChainId: integer('dao_chain_id').notNull().$type<SupportedChainId>(),
    daoAddress: hex('dao_address').notNull(),
    safeNonce: integer('safe_nonce').notNull(),
    title: text('title'),
    description: text('description'),
    proposer: hex('proposer').notNull(),
    metadataCID: text('metadata_cid'),
    dataDecoded: json('data_decoded').$type<DataDecoded>(),
    safeTxHash: hex('safe_tx_hash').notNull(),
    submissionDate: timestamp('submission_date').notNull(),
    transactionTo: hex('transaction_to').notNull(),
    transactionValue: text('transaction_value').notNull(),
    transactionData: hex('transaction_data').notNull(),
    confirmations: json('confirmations').$type<SafeMultisigConfirmationResponse[]>(),
    confirmationsRequired: integer('confirmations_required').notNull(),
  },
  t => [primaryKey({ columns: [t.daoChainId, t.daoAddress, t.safeTxHash] })],
);

export type DbSafeProposal = typeof safeProposalTable.$inferInsert;
