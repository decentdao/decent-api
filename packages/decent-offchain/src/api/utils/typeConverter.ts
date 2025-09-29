import { sql } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';
import { DbDao } from '@/db/schema/onchain';
import { BasicSafeInfo } from '@/lib/safe/types';
import { SubDaoInfo, ProposalTemplate } from '../middleware/dao';
import { getAddress } from 'viem';
import { DbProposal } from '@/db/schema';
import { DbSafeProposal } from '@/db/schema/offchain/safeProposals';
import { DecodedTransaction, MultisigProposal } from '../types';
import {
  isMultisigRejectionProposal,
  ADDRESS_MULTISIG_METADATA,
  parseDecodedData,
  decodeWithAPI,
} from './transactionParser';

export const bigIntText = (column: PgColumn, alias?: string) => {
  return sql<string>`${column}::text`.as(alias || column.name);
};

export const formatDao = (
  dbDao: DbDao,
  safeInfo: BasicSafeInfo,
  subDaos: SubDaoInfo[],
  proposalTemplates: ProposalTemplate[] | null,
) => {
  const guard = dbDao?.governanceGuards?.[0];
  // prettier-ignore
  const governanceGuard = guard ? {
    address: getAddress(guard.address),
    executionPeriod: guard.executionPeriod,
    timelockPeriod: guard.timelockPeriod,
    freezeVotingStrategy: guard.freezeVotingStrategies?.[0] ? {
      address: getAddress(guard.freezeVotingStrategies[0].address),
      freezePeriod: guard.freezeVotingStrategies[0].freezePeriod,
      freezeProposalPeriod: guard.freezeVotingStrategies[0].freezeProposalPeriod,
      freezeVotesThreshold: guard.freezeVotingStrategies[0].freezeVotesThreshold,
      freezeVoteType: guard.freezeVotingStrategies[0].freezeVoteType,
    } : null,
  } : null;

  const dao = {
    chainId: dbDao.chainId,
    address: dbDao.address,
    safe: {
      owners: safeInfo.owners,
      threshold: safeInfo.threshold,
      nonce: safeInfo.nonce,
    },
    name: dbDao.name,
    proposalTemplates,
    governanceModules: dbDao.governanceModules.map(module => ({
      address: getAddress(module.address),
      type: module.moduleType,
      executionPeriod: module.executionPeriod,
      timelockPeriod: module.timelockPeriod,
      strategies: module.votingStrategies.map(strategy => ({
        address: getAddress(strategy.address),
        version: 1, // TODO: [ENG-551] add version to db
        requiredProposerWeight: strategy.requiredProposerWeight,
        votingPeriod: strategy.votingPeriod,
        basisNumerator: strategy.basisNumerator,
        quorumNumerator: strategy.quorumNumerator,
        votingTokens: strategy.votingTokens.map(token => ({
          address: getAddress(token.address),
          type: token.type,
          weight: token?.weight || undefined,
        })),
      })),
    })),
    governanceGuard,
    roles: dbDao.roles,
    creatorAddress: getAddress(dbDao.creatorAddress),
    snapshotENS: dbDao.snapshotENS,
    createdAt: dbDao.createdAt || 0,
    updatedAt: dbDao.updatedAt,
    parentAddress: dbDao.subDaoOf,
    subDaos,
  };
  return dao;
};

const voteChoice = ['NO', 'YES', 'ABSTAIN'];

// FIXME: try catch this to prevent error out a list
export async function formatMultisigProposal(safeProposal: DbSafeProposal) {
  const eventDate = new Date(safeProposal.submissionDate);
  const eventSafeTxHash = safeProposal.safeTxHash;
  const eventNonce = safeProposal.safeNonce;

  const isMultisigRejectionTx: boolean | undefined = isMultisigRejectionProposal(
    safeProposal.daoAddress,
    safeProposal.transactionData,
    safeProposal.transactionTo,
    BigInt(safeProposal.transactionValue),
  );

  const confirmations = safeProposal.confirmations ?? [];
  const decodedData = safeProposal.dataDecoded;
  const skipDecode = safeProposal.transactionTo === ADDRESS_MULTISIG_METADATA;
  const dataIsEmpty = !safeProposal.transactionData || safeProposal.transactionData.length <= 2;

  let data = { decodedTransactions: [] } as { decodedTransactions: DecodedTransaction[] };
  if (decodedData) {
    data = {
      decodedTransactions: parseDecodedData(
        safeProposal.transactionTo,
        safeProposal.transactionValue,
        decodedData,
        true,
      ),
    };
  } else if (!decodedData && !dataIsEmpty && !skipDecode) {
    console.debug('wut', safeProposal.safeNonce, safeProposal.safeTxHash);
    data = {
      decodedTransactions: await decodeWithAPI(
        safeProposal.daoChainId,
        safeProposal.transactionValue,
        safeProposal.transactionTo,
        safeProposal.transactionData,
      ),
    };
  }

  const targets = data
    ? [...data.decodedTransactions.map(tx => tx.target)]
    : [getAddress(safeProposal.transactionTo)];

  const activity: MultisigProposal = {
    //transaction,
    eventDate,
    confirmations,
    signersThreshold: safeProposal.confirmationsRequired,
    isMultisigRejectionTx,
    proposalId: eventSafeTxHash,
    targets,
    proposer: safeProposal.proposer,
    // FIXME note below comments when integrating
    // @todo typing for `multiSigTransaction.transactionHash` is misleading, as ` multiSigTransaction.transactionHash` is not always defined (if ever). Need to tighten up the typing here.
    // ! @todo This is why we are showing the two different hashes
    //transactionHash: transaction.transactionHash ?? transaction.safeTxHash,
    transactionHash: safeProposal.safeTxHash,
    data: data,
    state: null,
    nonce: eventNonce,
  };
  return activity;
}

export const formatProposal = (dbProposal: DbProposal) => {
  const proposal = {
    id: dbProposal.id,
    title: dbProposal.title,
    description: dbProposal.description,
    proposer: dbProposal.proposer,
    votingStrategyAddress: dbProposal.votingStrategyAddress,
    transactions: dbProposal.transactions,
    proposedTxHash: dbProposal.proposedTxHash,
    executedTxHash: dbProposal.executedTxHash,
    createdAt: dbProposal.createdAt,
    snapshotBlock: dbProposal.snapshotBlock,
    votingEndBlock: dbProposal.votingEndBlock,
    votingEndTimestamp: dbProposal.blockTimestamp?.timestamp || null,
    votes: dbProposal.votes?.map(v => ({
      voter: v.voter,
      choice: voteChoice[v.voteType],
      weight: v.weight,
    })),
  };
  return proposal;
};
