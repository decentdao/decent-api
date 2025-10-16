import { Context, Next } from 'hono';
import { Address, isAddress } from 'viem';
import { and, eq, inArray } from 'drizzle-orm';
import { Dao, SupportedChainId } from 'decent-sdk';
import { db } from '@/db';
import { CHILD_SELECT_FIELDS, DEFAULT_DAO_WITH, SIMPLE_DAO_SELECT_FIELDS } from '@/db/queries';
import { ApiError } from '@/api/utils/responseFormatter';
import { formatDao } from '@/api/utils/typeConverter';
import { DbDao } from '@/db/schema/onchain';
import { getChainId } from '@/api/utils/chains';
import { getSafeInfo } from '@/lib/safe';
import { BasicSafeInfo } from '@/lib/safe/types';
import { getFreezeInfo } from '@/lib/freezeGuard';
import { FreezeInfo } from '@/lib/freezeGuard/types';
import { schema } from '@/db/schema';
import { ipfsCacheFetch } from '../utils/ipfs';
import { formatRoles } from '../utils/roles';

const MAX_SUB_DAO_DEPTH = 3;

declare module 'hono' {
  interface ContextVariableMap {
    basicDaoInfo: BasicDaoInfo;
    dao: Dao & {
      safe: BasicSafeInfo;
      subDaos: SubDaoInfo[];
      proposalTemplates: ProposalTemplate[] | null;
    }; // @TODO: update SDK types
  }
}

export type BasicDaoInfo = {
  address: Address;
  chainId: SupportedChainId;
  name: string | null;
  isAzorius: boolean;
};

export type SubDaoInfo = {
  address: Address;
  name: string | null;
  isAzorius: boolean;
  subDaos?: SubDaoInfo[];
};

export type EthValue = {
  value: string;
  bigintValue: string;
};

export type TransactionParameter = {
  signature: string;
  label: string;
  value: string;
};

export type CustomTransaction = {
  targetAddress: string;
  ethValue: EthValue;
  functionName: string;
  parameters: TransactionParameter[];
};

export type ProposalTemplate = {
  title: string;
  description: string;
  transactions: CustomTransaction[];
};

async function fetchNestedSubDaos(
  addresses: Address[],
  chainId: number,
  depth = 0,
): Promise<SubDaoInfo[]> {
  if (depth > MAX_SUB_DAO_DEPTH || addresses.length === 0) return [];

  const subDaos = await db
    .select(CHILD_SELECT_FIELDS)
    .from(schema.daoTable)
    .where(inArray(schema.daoTable.address, addresses));

  const result = await Promise.all(
    subDaos.map(async dao => {
      const nestedSubDaos =
        dao.subDaoAddresses && dao.subDaoAddresses.length > 0
          ? await fetchNestedSubDaos(dao.subDaoAddresses, chainId, depth + 1)
          : [];

      return {
        address: dao.address as Address,
        name: dao.name,
        isAzorius: dao.isAzorius,
        ...(nestedSubDaos.length > 0 && { subDaos: nestedSubDaos }),
      };
    }),
  );

  return result;
}

// set basicDaoInfo for more efficient routes when we don't need all the Safe info etc
export const daoExists = async (c: Context, next: Next) => {
  const { chainId, address } = c.req.param();
  const chainIdNumber = getChainId(chainId);

  const addressLower = address?.toLowerCase();
  if (!addressLower || !isAddress(addressLower)) throw new ApiError('Invalid dao address', 400);

  const [basicDaoInfo] = await db
    .select(SIMPLE_DAO_SELECT_FIELDS)
    .from(schema.daoTable)
    .where(
      and(eq(schema.daoTable.chainId, chainIdNumber), eq(schema.daoTable.address, addressLower)),
    )
    .limit(1);

  if (!basicDaoInfo) throw new ApiError('DAO not found', 404);

  c.set('basicDaoInfo', basicDaoInfo);
  await next();
};

export const daoFetch = async (c: Context, next: Next) => {
  const { chainId, address } = c.req.param();
  const chainIdNumber = getChainId(chainId);

  const addressLower = address?.toLowerCase();
  if (!addressLower || !isAddress(addressLower)) throw new ApiError('Invalid dao address', 400);

  const dao = (await db.query.daoTable.findFirst({
    where: (dao, { eq, and }) => and(eq(dao.chainId, chainIdNumber), eq(dao.address, addressLower)),
    with: DEFAULT_DAO_WITH,
  })) as DbDao | undefined;

  const subDaos = dao?.subDaoAddresses
    ? await fetchNestedSubDaos(dao.subDaoAddresses, chainIdNumber)
    : [];

  if (!dao) throw new ApiError('DAO not found', 404);

  // get most uptodate safe info with contract read
  const safeInfo = await getSafeInfo(chainIdNumber, addressLower);

  // check if DAO is frozen (if it has a freeze voting strategy)
  let freezeInfo: FreezeInfo | undefined;
  const governanceGuard = dao.governanceGuards?.[0];
  const freezeVotingStrategy = governanceGuard?.freezeVotingStrategies?.[0];

  if (freezeVotingStrategy?.address) {
    freezeInfo = await getFreezeInfo(dao.chainId, freezeVotingStrategy.address);
  }

  // fetch custom templates from IPFS if available
  const proposalTemplates = dao.proposalTemplatesCID
    ? ((await ipfsCacheFetch(dao.proposalTemplatesCID)) as ProposalTemplate[])
    : null;

  dao.roles = await formatRoles(dao.roles);

  c.set('dao', formatDao(dao, safeInfo, subDaos, proposalTemplates, freezeInfo));
  await next();
};
