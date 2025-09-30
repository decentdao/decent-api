import {
  SafeMultisigConfirmationResponse,
  SafeMultisigTransactionResponse,
} from '@/lib/safe/types';
import { Address, Hex } from 'viem';

/**
 * The possible states of a DAO proposal, for both Token Voting (Azorius) and Multisignature
 * (Safe) governance, as well as Snapshot specific states.
 *
 * @note it is required that Azorius-specific states match those on the Azorius contracts,
 * including casing and ordering.  States not specific to Azorius must be placed at the end
 * of this enum.
 */
export enum FractalProposalState {
  /**
   * Proposal is created and can be voted on.  This is the initial state of all
   * newly created proposals.
   *
   * Azorius / Multisig (all proposals).
   */
  ACTIVE = 'stateActive',

  /**
   * A proposal that passes enters the `TIMELOCKED` state, during which it cannot yet be executed.
   * This is to allow time for token holders to potentially exit their position, as well as parent DAOs
   * time to initiate a freeze, if they choose to do so. A proposal stays timelocked for the duration
   * of its `timelockPeriod`.
   *
   * Azorius (all) and multisig *subDAO* proposals.
   */
  TIMELOCKED = 'stateTimeLocked',

  /**
   * Following the `TIMELOCKED` state, a passed proposal becomes `EXECUTABLE`, and can then finally
   * be executed on chain.
   *
   * Azorius / Multisig (all proposals).
   */
  EXECUTABLE = 'stateExecutable',

  /**
   * The final state for a passed proposal.  The proposal has been executed on the blockchain.
   *
   * Azorius / Multisig (all proposals).
   */
  EXECUTED = 'stateExecuted',

  /**
   * A passed proposal which is not executed before its `executionPeriod` has elapsed will be `EXPIRED`,
   * and can no longer be executed.
   *
   * Azorius (all) and multisig *subDAO* proposals.
   */
  EXPIRED = 'stateExpired',

  /**
   * A failed proposal (as defined by its [BaseStrategy](../BaseStrategy.md) `isPassed` function). For a basic strategy,
   * this would mean it received more NO votes than YES or did not achieve quorum.
   *
   * Azorius only.
   */
  FAILED = 'stateFailed',

  /**
   * Proposal fails due to a proposal being executed with the same nonce.
   * A multisig proposal is off-chain, and is signed with a specific nonce.
   * If a proposal with a nonce is executed, any proposal with the same or lesser
   * nonce will be impossible to execute, reguardless of how many signers it has.
   *
   * Multisig only.
   */
  REJECTED = 'stateRejected',

  /**
   * Quorum (or signers) is reached, the proposal can be 'timelocked' for execution.
   * Anyone can move the state from Timelockable to TimeLocked via a transaction.
   *
   * Multisig subDAO only, Azorius DAOs move from ACTIVE to TIMELOCKED automatically.
   */
  TIMELOCKABLE = 'stateTimelockable',

  /**
   * Any Safe is able to have modules attached (e.g. Azorius), which can act essentially as a backdoor,
   * executing transactions without needing the required signers.
   *
   * Safe Module 'proposals' in this sense are single state proposals that are already executed.
   *
   * This is a rare case, but third party modules could potentially generate this state so we allow
   * for badges to properly label this case in the UI.
   *
   * Third party Safe module transactions only.
   */
  MODULE = 'stateModule',

  /**
   * The proposal is pending, meaning it has been created, but voting has not yet begun. This state
   * has nothing to do with Fractal, and is used for Snapshot proposals only, which appear if the
   * DAO's snapshotENS is set.
   */
  PENDING = 'statePending',

  /**
   * The proposal is closed, and no longer able to be signed. This state has nothing to do with Fractal,
   * and is used for Snapshot proposals only, which appear if the DAO's snapshotENS is set.
   */
  CLOSED = 'stateClosed',
}

export const strategyFractalProposalStates = Object.values(FractalProposalState);

export type ActivityTransactionType = SafeMultisigTransactionResponse;

export interface ActivityBase {
  eventDate: Date;
  // TODO could we return undefined for this if querying from db,
  //   since we got all raw data and parsed fields?
  transaction?: ActivityTransactionType;
  transactionHash: string;
}

export type CreateProposalMetadata = {
  title: string;
  description: string;
  documentationUrl?: string;
  nonce?: number;
};

export interface MetaTransaction {
  to: Address;
  value: bigint;
  data: Hex;
  operation: number;
}

export interface DecodedTransaction {
  target: Address;
  value: string;
  function: string;
  parameterTypes: string[];
  parameterValues: string[];
  decodingFailed?: boolean;
}

export type ProposalData = {
  metaData?: CreateProposalMetadata;
  transactions?: MetaTransaction[];
  decodedTransactions: DecodedTransaction[];
};

export interface GovernanceActivity extends ActivityBase {
  proposer: Address | null;
  state: FractalProposalState | null;
  proposalId: string;
  targets: Address[];
  data?: ProposalData;
  title?: string;
}

export type ProposalVotesSummary = {
  yes: bigint;
  no: bigint;
  abstain: bigint;
  quorum: bigint;
};

export type ProposalVotesSummaryString = {
  yes: string;
  no: string;
  abstain: string;
  quorum: string;
};

export const VOTE_CHOICES = [
  {
    label: 'yes',
    value: 1,
  },
  {
    label: 'no',
    value: 0,
  },
  {
    label: 'abstain',
    value: 2,
  },
] as const;

export type ProposalVote = {
  voter: Address;
  choice: (typeof VOTE_CHOICES)[number];
  weight: bigint | string;
};

export type ERC721ProposalVote = {
  tokenAddresses: Address[];
  tokenIds: string[];
} & ProposalVote;

export interface AzoriusProposal extends GovernanceActivity {
  votingStrategy: Address;
  votesSummary: ProposalVotesSummaryString;
  votes: ProposalVote[] | ERC721ProposalVote[];
  /** The deadline timestamp for the proposal, in milliseconds. */
  deadlineMs: number;
  startBlock: number;
}

export interface MultisigProposal extends GovernanceActivity {
  confirmations?: SafeMultisigConfirmationResponse[];
  signersThreshold?: number;
  isMultisigRejectionTx?: boolean;
  nonce?: number;
}

export interface SnapshotProposal extends GovernanceActivity {
  snapshotProposalId: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  author: Address;
}

export type FractalProposal = AzoriusProposal | MultisigProposal | SnapshotProposal;
