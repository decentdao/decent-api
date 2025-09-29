import { boolean, index, text } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { offchainSchema } from './offchain';
import { hex } from '../hex';
import { timestamps } from '../timestamps';

export const REVIEW_STATUSES = [
  'init',
  'pending',
  'completed',
  'onHold',
  'awaitingService',
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const kycTable = offchainSchema.table(
  'kyc',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => nanoid()),
    address: hex().notNull(),
    applicantId: text(),
    reviewStatus: text().default('init').$type<ReviewStatus>(),
    isKycApproved: boolean().notNull().default(false),
    rejectLabels: text().array(),
    sandboxMode: boolean().notNull().default(false),
    ...timestamps,
  },
  table => [index('kyc_address_idx').on(table.address)],
);
