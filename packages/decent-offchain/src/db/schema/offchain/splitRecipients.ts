import { integer, primaryKey, json } from 'drizzle-orm/pg-core';
import { Address } from 'viem';
import { offchainSchema } from './offchain';
import { hex } from '../hex';

export type SplitRecipient = {
  address: Address;
  percentage: number;
};

export const splitRecipientTable = offchainSchema.table(
  'split_recipients',
  {
    splitAddress: hex('split_address').notNull(),
    daoChainId: integer('dao_chain_id').notNull(),
    daoAddress: hex('dao_address').notNull(),
    recipients: json('recipients').$type<SplitRecipient[]>(),
  },
  t => [primaryKey({ columns: [t.splitAddress, t.daoChainId, t.daoAddress] })],
);

