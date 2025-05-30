import { integer, text, primaryKey, jsonb } from 'drizzle-orm/pg-core';
import { Abi } from 'viem';
import { offchainSchema } from './offchain';
import { hex } from '../hex';

export const contractTable = offchainSchema.table(
  'contracts',
  {
    address: hex('address').notNull(),
    chainId: integer('chain_id').notNull(),
    name: text('name'),
    abi: jsonb('abi').$type<Abi>(),
    implementation: hex('implementation'), // if proxy, this is the implementation address
  },
  t => [primaryKey({ columns: [t.address, t.chainId] })],
);
