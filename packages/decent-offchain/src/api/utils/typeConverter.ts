/* eslint-disable @stylistic/indent */
import { sql } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';
import { DbDao } from '@/db/schema/onchain';
import { BasicSafeInfo } from '@/lib/safe/types';
import { FreezeInfo } from '@/lib/freezeGuard/types';
import { SubDaoInfo, ProposalTemplate } from '../middleware/dao';
import { getAddress } from 'viem';
import { DbProposal } from '@/db/schema';
import { DbSafeProposal } from '@/db/schema/offchain/safeProposals';
import {
  AzoriusProposal,
  DecodedTransaction,
  FractalProposalState,
  MultisigProposal,
  ProposalVotesSummary,
  ProposalVotesSummaryString,
  VOTE_CHOICES,
} from '../types';
import {
  isMultisigRejectionProposal,
  ADDRESS_MULTISIG_METADATA,
  parseDecodedData,
  decodeWithAPI,
} from './transactionParser';
import { getPublicClient } from './publicClient';
import { legacy } from '@decentdao/decent-contracts';

export const bigIntText = (column: PgColumn, alias?: string) => {
  return sql<string>`${column}::text`.as(alias || column.name);
};

export const formatDao = (
  dbDao: DbDao,
  safeInfo: BasicSafeInfo,
  subDaos: SubDaoInfo[],
  proposalTemplates: ProposalTemplate[] | null,
  freezeInfo?: FreezeInfo,
) => {
  const guard = dbDao?.governanceGuards?.[0];
  // prettier-ignore
  const governanceGuard = guard ? {
    address: getAddress(guard.address),
    executionPeriod: guard.executionPeriod,
    timelockPeriod: guard.timelockPeriod,
    isFrozen: freezeInfo?.isFrozen || false,
    freezeProposalCreatedBlock: freezeInfo?.freezeProposalCreatedBlock,
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

const VOTE_CHOICES_INDEX_MAP = [VOTE_CHOICES[1], VOTE_CHOICES[0], VOTE_CHOICES[2]];

// FIXME: try catch this to prevent error out a list
export async function formatMultisigProposal(
  proposal: DbSafeProposal & { state: FractalProposalState },
): Promise<MultisigProposal> {
  const eventDate = new Date(proposal.submissionDate);
  const eventSafeTxHash = proposal.safeTxHash;
  const eventNonce = proposal.safeNonce;

  const isMultisigRejectionTx: boolean | undefined = isMultisigRejectionProposal(
    proposal.daoAddress,
    proposal.transactionData,
    proposal.transactionTo,
    BigInt(proposal.transactionValue),
  );

  const confirmations = proposal.confirmations ?? [];
  const decodedData = proposal.dataDecoded;
  const skipDecode = proposal.transactionTo === ADDRESS_MULTISIG_METADATA;
  const dataIsEmpty = !proposal.transactionData || proposal.transactionData.length <= 2;

  let data = { decodedTransactions: [] } as { decodedTransactions: DecodedTransaction[] };
  if (decodedData) {
    data = {
      decodedTransactions: parseDecodedData(
        proposal.transactionTo,
        proposal.transactionValue,
        decodedData,
        true,
      ),
    };
  } else if (!decodedData && !dataIsEmpty && !skipDecode) {
    data = {
      decodedTransactions: await decodeWithAPI(
        proposal.daoChainId,
        proposal.transactionValue,
        proposal.transactionTo,
        proposal.transactionData,
      ),
    };
  }

  const targets = data
    ? [...data.decodedTransactions.map(tx => tx.target)]
    : [getAddress(proposal.transactionTo)];

  const multisigProposal: MultisigProposal = {
    //transaction,
    eventDate,
    confirmations,
    signersThreshold: proposal.confirmationsRequired,
    isMultisigRejectionTx,
    proposalId: eventSafeTxHash,
    targets,
    proposer: proposal.proposer,
    // FIXME note below comments when integrating
    // @todo typing for `multiSigTransaction.transactionHash` is misleading, as ` multiSigTransaction.transactionHash` is not always defined (if ever). Need to tighten up the typing here.
    // ! @todo This is why we are showing the two different hashes
    //transactionHash: transaction.transactionHash ?? transaction.safeTxHash,
    transactionHash: proposal.safeTxHash,
    // TODO: title and description should be put in data.metadata?
    data: data,
    state: proposal.state,
    nonce: eventNonce,
  };
  return multisigProposal;
}

export async function formatAzoriusProposal(proposal: DbProposal): Promise<AzoriusProposal> {
  // Which type is the voting strategy?
  const votingType = proposal.votingTokens.type;

  // Get quorum based on votingType
  let quorum = 0n;
  if (votingType === 'ERC20') {
    const client = getPublicClient(proposal.daoChainId);
    quorum = await client.readContract({
      address: proposal.votingStrategyAddress,
      abi: legacy.abis.LinearERC20Voting,
      functionName: 'quorumVotes',
      args: [proposal.id],
    });
  } else {
    // TODO: we could fetch from DB
    //  today we send a RPC for quick implmentation
    const client = getPublicClient(proposal.daoChainId);
    quorum = await client.readContract({
      address: proposal.votingStrategyAddress,
      abi: legacy.abis.LinearERC721Voting,
      functionName: 'quorumThreshold',
    });
  }

  // TODO: handle ERC721? tokenIds in votes type
  const votes =
    proposal.votes?.map(v => ({
      voter: v.voter,
      choice: VOTE_CHOICES_INDEX_MAP[v.voteType]!,
      weight: BigInt(v.weight || 0),
    })) || [];
  const votesSummary: ProposalVotesSummary = {
    yes: 0n,
    no: 0n,
    abstain: 0n,
    quorum,
  };
  votes.forEach(v => {
    const choice = v.choice.label;
    if (choice === 'yes') {
      votesSummary.yes += v.weight;
    } else if (choice === 'no') {
      votesSummary.no += v.weight;
    } else if (choice === 'abstain') {
      votesSummary.abstain += v.weight;
    }
  });

  // Must convert to string to be able to return as JSON
  const votesSummaryString: ProposalVotesSummaryString = {
    yes: votesSummary.yes.toString(),
    no: votesSummary.no.toString(),
    abstain: votesSummary.abstain.toString(),
    quorum: votesSummary.quorum.toString(),
  };

  // Must convert to string to be able to return as JSON
  const votesString = votes.map(v => ({ ...v, weight: v.weight.toString() }))

  // Decode
  const decodedTransactions = proposal.transactions
    ? (
        await Promise.all(
          proposal.transactions.map(async tx =>
            decodeWithAPI(proposal.daoChainId, tx.value.toString(), tx.to, tx.data),
          ),
        )
      ).flat()
    : [];
  const data = {
    decodedTransactions,
  };
  const targets = [...data.decodedTransactions.map(tx => tx.target)];

  const azoriusProposal: AzoriusProposal = {
    eventDate: new Date(proposal.createdAt * 1000),
    // FIXME should be executedTxHash?
    //   can be null if not executed yet?
    transactionHash: proposal.proposedTxHash,
    proposer: proposal.proposer,
    state: null, // will be added in mergeState function
    proposalId: proposal.id.toString(),
    targets,
    data,
    // TODO: description should be put in data.metadata.description?
    title: proposal.title,
    votingStrategy: proposal.votingStrategyAddress,
    votesSummary: votesSummaryString,
    votes: votesString,
    deadlineMs: proposal.blockTimestamp?.timestamp || 0,
    startBlock: proposal.snapshotBlock,
  };
  return azoriusProposal;
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
      choice: VOTE_CHOICES_INDEX_MAP[v.voteType],
      weight: v.weight,
    })),
  };
  return proposal;
};
