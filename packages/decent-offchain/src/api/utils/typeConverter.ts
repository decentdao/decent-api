import { DbDao } from '@/db/schema/onchain';
import { Dao } from '@/api/types/Dao';
import { zeroAddress } from 'viem';

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
