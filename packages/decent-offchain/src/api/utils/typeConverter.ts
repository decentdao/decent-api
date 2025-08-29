import { sql } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';
import { Dao } from 'decent-sdk';
import { DbDao, DbOnchainProposal } from '@/db/schema/onchain';
import { unixTimestamp } from './time';

export const bigIntText = (column: PgColumn, alias?: string) => {
  return sql<string>`${column}::text`.as(alias || column.name);
};

export const formatDao = (dbDao: DbDao): Dao => {
  const now = unixTimestamp();
  const dao = {
    chainId: dbDao.chainId,
    address: dbDao.address,
    safe: {
      owners: dbDao.signers.map(signer => signer.address),
      threshold: dbDao.requiredSignatures || 0,
    },
    name: dbDao.name,
    proposalTemplatesCID: dbDao.proposalTemplatesCID,
    governanceModules: dbDao.governanceModules.map(module => ({
      address: module.address,
      type: module.moduleType,
      executionPeriod: module.executionPeriod,
      timelockPeriod: module.timelockPeriod,
      strategies: module.votingStrategies.map(strategy => ({
        address: strategy.address,
        version: 1, // TODO: [ENG-551] add version to db
        requiredProposerWeight: strategy.requiredProposerWeight,
        votingPeriod: strategy.votingPeriod,
        basisNumerator: strategy.basisNumerator,
        quorumNumerator: strategy.quorumNumerator,
        votingTokens: strategy.votingTokens.map(token => ({
          address: token.address,
          type: token.type,
          weight: token?.weight || undefined,
        })),
      })),
    })),
    roles: dbDao.roles.map(role => ({
      ...role,
      terms: role.terms?.map(term => ({
        ...term,
        active: term.termEnd >= now,
      })),
    })),
    creatorAddress: dbDao.creatorAddress,
    snapshotENS: dbDao.snapshotENS,
    createdAt: dbDao.createdAt || 0,
    updatedAt: dbDao.updatedAt,
    parentAddress: dbDao.subDaoOf,
  };
  return dao;
};

const voteChoice = ['NO', 'YES', 'ABSTAIN'];

export const formatProposal = (dbProposal: DbOnchainProposal) => {
  const proposal = {
    id: dbProposal.id, // Already a string
    title: dbProposal.title,
    description: dbProposal.description,
    proposer: dbProposal.proposer,
    votingStrategyAddress: dbProposal.votingStrategyAddress,
    transactions: dbProposal.transactions,
    proposedTxHash: dbProposal.proposedTxHash,
    executedTxHash: dbProposal.executedTxHash,
    createdAt: dbProposal.createdAt, // Already a string
    votes: dbProposal.votes?.map(v => ({
      voter: v.voter,
      choice: voteChoice[v.voteType],
      weight: v.weight,
    })),
  };
  return proposal;
};
