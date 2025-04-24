import { zeroAddress } from 'viem';
import { Comment, Dao, Proposal } from 'decent-sdk';
import { DbDao } from '@/db/schema/onchain';
import { DbComment, DbProposal } from '@/db/schema';
import { unixTimestamp } from './time';

export const formatDao = (dbDao: DbDao): Dao => {
  const dao: Dao = {
    chainId: dbDao.chainId,
    address: dbDao.address,
    safe: {
      owners: dbDao.signers.map((signer) => signer.address),
      threshold: dbDao.requiredSignatures || 0,
    },
    name: dbDao.name,
    proposalTemplatesCID: dbDao.proposalTemplatesCID,
    governanceModules: dbDao.governanceModules.map((module) => ({
      address: module.address,
      strategies: module.votingStrategies.map((strategy) => ({
        address: strategy.address,
        version: 1, // TODO: [ENG-551] add version to db
        votingTokens: strategy.votingTokens.map((token) => ({
          address: token.address,
          type: token.type,
        })),
      })),
    })),
    guardAddress: dbDao.guardAddress || zeroAddress,
    fractalModuleAddress: dbDao.fractalModuleAddress,
    hatIdToStreamIds: dbDao.hatIdToStreamIds.map((hatIdToStreamId) => ({
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

export const formatProposal = (dbProposal: DbProposal): Proposal => {
  const proposal: Proposal = {
    slug: dbProposal.slug,
    title: dbProposal.title,
    body: dbProposal.body,
    status: dbProposal.status || 'pending',
    authorAddress: dbProposal.authorAddress,
    metadataCID: dbProposal.metadataCID,
    id: dbProposal.id,
    safeNonce: dbProposal.safeNonce,
    executedTxHash: dbProposal.executedTxHash,
    votingStrategyAddress: dbProposal.votingStrategyAddress,
    voteStartsAt: unixTimestamp(dbProposal.voteStartsAt),
    voteEndsAt: unixTimestamp(dbProposal.voteEndsAt),
    discussionId: dbProposal.discussionId,
    version: dbProposal.version || 1,
    votes: [], // TODO: [ENG-622] votes storage spike
    cycle: dbProposal.cycle,
    voteType: dbProposal.voteType,
    voteChoices: dbProposal.voteChoices,
    createdAt: unixTimestamp(dbProposal.createdAt) || 0,
    updatedAt: unixTimestamp(dbProposal.updatedAt) || 0,
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
