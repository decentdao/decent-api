import { Dao } from 'decent-sdk';
import { DbDao, DbOnchainProposal } from '@/db/schema/onchain';

export const formatDao = (dbDao: DbDao): Dao => {
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
          weight: token.weight,
        })),
      })),
    })),
    hatIdToStreamIds: dbDao.hatIdToStreamIds.map(hatIdToStreamId => ({
      hatId: hatIdToStreamId.hatId,
      streamId: hatIdToStreamId.streamId,
    })),
    creatorAddress: dbDao.creatorAddress,
    snapshotENS: dbDao.snapshotENS,
    createdAt: dbDao.createdAt || 0,
    updatedAt: dbDao.updatedAt || 0,
    parent: null,
    children: null,
  };
  return dao;
};

export const formatProposal = (dbProposal: DbOnchainProposal) => {
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
  };
  return proposal;
};
