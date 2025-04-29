import { nanoid } from 'nanoid';
import { text, index } from 'drizzle-orm/pg-core';
import { offchainSchema } from './offchain';
import { hex } from '../hex';
import { timestamps } from '../timestamps';

export const temperatureCheckTable = offchainSchema.table(
  'temperatureChecks',
  {
    id: text()
      .primaryKey()
      .unique()
      .$defaultFn(() => nanoid()),
    proposalSlug: text().notNull(),
    authorAddress: hex().notNull(),
    temperature: text().notNull(),
    ...timestamps,
  },
  t => [index().on(t.proposalSlug), index().on(t.authorAddress)],
);
