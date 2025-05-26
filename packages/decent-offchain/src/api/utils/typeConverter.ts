import { zeroAddress } from 'viem';
import { Comment, Dao } from 'decent-sdk';
import { DbDao, DbOnchainProposal } from '@/db/schema/onchain';
import { DbComment } from '@/db/schema';
import { unixTimestamp } from './time';

export const formatDao = (dbDao: DbDao): Dao => {
  const dao: Dao = {
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
      strategies: module.votingStrategies.map(strategy => ({
        address: strategy.address,
        version: 1, // TODO: [ENG-551] add version to db
        votingTokens: strategy.votingTokens.map(token => ({
          address: token.address,
          type: token.type,
        })),
      })),
    })),
    guardAddress: dbDao.guardAddress || zeroAddress,
    fractalModuleAddress: dbDao.fractalModuleAddress,
    hatIdToStreamIds: dbDao.hatIdToStreamIds.map(hatIdToStreamId => ({
      hatId: hatIdToStreamId.hatId,
      streamId: hatIdToStreamId.streamId,
    })),
    gastank: {
      address: dbDao.gasTankAddress,
      enabled: Boolean(dbDao.gasTankAddress && dbDao.gasTankEnabled),
    },
    snapshotENS: dbDao.snapshotENS,
    createdAt: dbDao.createdAt || 0,
    updatedAt: dbDao.updatedAt || 0,
    parent: null,
    children: null,
    cycle: null,
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
    decodedTransactions: dbProposal.decodedTransactions,
    proposedTxHash: dbProposal.proposedTxHash,
    executedTxHash: dbProposal.executedTxHash,
    createdAt: dbProposal.createdAt,
  };
  return proposal;
};

export const formatComment = (dbComment: DbComment): Comment => {
  const comment: Comment = {
    id: dbComment.id,
    authorAddress: dbComment.authorAddress,
    createdAt: unixTimestamp(dbComment.createdAt) || 0,
    updatedAt: unixTimestamp(dbComment.updatedAt) || 0,
    replyToId: dbComment.replyToId,
    proposalSlug: dbComment.proposalSlug || '',
    content: dbComment.content,
  };
  return comment;
};
