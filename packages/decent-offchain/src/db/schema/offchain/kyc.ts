import { boolean, pgEnum, text } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { offchainSchema } from './offchain';
import { hex } from '../hex';
import { timestamps } from '../timestamps';

export const reviewStatusEnum = pgEnum('review_status', [
  'init',
  'pending',
  'completed',
  'onHold',
  'awaitingService',
]);

export const kycTable = offchainSchema.table('kyc', {
  id: text()
    .primaryKey()
    .$defaultFn(() => nanoid()),
  address: hex().notNull(),
  applicantId: text(),
  reviewStatus: reviewStatusEnum().default('init'),
  isKycApproved: boolean().notNull().default(false),
  ...timestamps,
});
