import * as onchainSchema from './onchain';
import { sessionTable } from './offchain/sessions';
import { safeProposalTable } from './offchain/safeProposals';
import { splitRecipientTable } from './offchain/splitRecipients';

export const schema = {
  ...onchainSchema,
  safeProposalTable,
  sessionTable,
  splitRecipientTable,
};

export type DbNewSafeProposal = typeof safeProposalTable.$inferInsert;
