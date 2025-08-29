import { sql } from 'drizzle-orm';
import { schema } from './schema';
import { bigIntText } from '@/api/utils/typeConverter';

export const DEFAULT_DAO_WITH = {
  governanceModules: {
    columns: {
      address: true,
      moduleType: true,
      executionPeriod: true,
      timelockPeriod: true,
    },
    with: {
      votingStrategies: {
        columns: {
          address: true,
          votingPeriod: true,
          basisNumerator: true,
          quorumNumerator: true,
        },
        extras: {
          requiredProposerWeight: bigIntText(schema.votingStrategyTable.requiredProposerWeight),
        },
        with: {
          votingTokens: {
            columns: {
              address: true,
              type: true,
              weight: true,
            },
          },
        },
      },
    },
  },
  signers: {
    columns: {
      address: true,
    },
  },
  roles: {
    columns: {
      hatId: true,
      detailsCID: true,
      wearerAddress: true,
    },
    with: {
      streams: {
        columns: {
          streamId: true,
          smartAccount: true,
          asset: true,
          start: true,
          cliff: true,
          end: true,
          cancelable: true,
          transferable: true,
        },
        extras: {
          amount: bigIntText(schema.streamTable.amount),
        },
      },
      terms: {
        columns: {
          termEnd: true,
          wearerAddress: true,
        },
      },
    },
  },
};

export const DAO_SELECT_FIELDS = {
  chainId: schema.daoTable.chainId,
  address: schema.daoTable.address,
  name: schema.daoTable.name,
  proposalTemplatesCID: schema.daoTable.proposalTemplatesCID,
  snapshotENS: schema.daoTable.snapshotENS,
  subDaoOf: schema.daoTable.subDaoOf,
  topHatId: schema.daoTable.topHatId,
  gasTankEnabled: schema.daoTable.gasTankEnabled,
  gasTankAddress: schema.daoTable.gasTankAddress,
  creatorAddress: schema.daoTable.creatorAddress,
  requiredSignatures: schema.daoTable.requiredSignatures,
  erc20Address: schema.daoTable.erc20Address,
  createdAt: schema.daoTable.createdAt,
  updatedAt: schema.daoTable.updatedAt,
  governanceModuleExists: sql<boolean>`
    EXISTS (
      SELECT 1 FROM ${schema.governanceModuleTable}
      WHERE ${schema.daoTable.chainId} = ${schema.governanceModuleTable.daoChainId}
        AND ${schema.daoTable.address} = ${schema.governanceModuleTable.daoAddress}
    )
  `.as('governanceModuleExists'),
};

export const DAO_GOVERNANCE_MODULE_JOIN_CONDITION = sql`${schema.daoTable.chainId} = ${schema.governanceModuleTable.daoChainId} AND ${schema.daoTable.address} = ${schema.governanceModuleTable.daoAddress}`;
