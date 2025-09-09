import { sql } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';
import { DbDao, DbGovernanceGuard } from '@/db/schema/onchain';
import { unixTimestamp } from './time';
import { BasicSafeInfo } from '@/lib/safe/types';
import { SubDaoInfo } from '../middleware/dao';
import { getAddress } from 'viem';
import { DbProposal } from '@/db/schema';

export const bigIntText = (column: PgColumn, alias?: string) => {
  return sql<string>`${column}::text`.as(alias || column.name);
};

export const formatDao = (dbDao: DbDao, safeInfo: BasicSafeInfo, subDaos: SubDaoInfo[]) => {
  const now = unixTimestamp();

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
    proposalTemplatesCID: dbDao.proposalTemplatesCID,
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
    roles: dbDao.roles.map(role => ({
      ...role,
      terms: role.terms?.map(term => ({
        ...term,
        active: term.termEnd >= now,
      })),
    })),
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
