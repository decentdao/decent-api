import { boolean, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { offchainSchema } from './offchain';
import { hex } from '../hex';
import { timestamps } from '../timestamps';

export const REVIEW_STATUSES = ['init', 'pending', 'completed', 'onHold', 'awaitingService'] as const;
export type ReviewStatus = typeof REVIEW_STATUSES[number];

export const kycTable = offchainSchema.table('kyc', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => nanoid()),
  address: hex().notNull(),
  applicantId: text('applicant_id'),
  reviewStatus: text('review_status').default('init').$type<ReviewStatus>(),
  isKycApproved: boolean().notNull().default(false),
  ...timestamps,
}, (table) => [
  uniqueIndex('kyc_address_idx').on(table.address),
]);
