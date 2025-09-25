import { Hono } from 'hono';
import { sql, asc } from 'drizzle-orm';
import { db } from '@/db';
import resf, { ApiError } from '@/api/utils/responseFormatter';
import { bearerAuth } from '@/api/middleware/auth';
import { daoFetch, daoExists } from '@/api/middleware/dao';
import { permissionsCheck } from '@/api/middleware/permissions';
import { getChainId } from '@/api/utils/chains';
import { getCIDFromSafeTransaction, getSafeTransactions } from '@/lib/safe';
import { schema } from '@/db/schema';
import { DAO_SELECT_FIELDS, DAO_GOVERNANCE_MODULE_JOIN_CONDITION } from '@/db/queries';
import { fetchMetadata } from '@/api/utils/metadata';
import { DbSafeProposal } from '@/db/schema/offchain/safeProposals';
import { Hex } from 'viem';

const app = new Hono();

/**
 * @title Get all DAOs
 * @route GET /d
 * @param {string} [name] - Optional name query parameter
 * @returns {Dao[]} Array of DAO objects
 */
app.get('/', async c => {
  const nameQueryParam = c.req.query('name');
  const daos = await db
    .select(DAO_SELECT_FIELDS)
    .from(schema.daoTable)
    .leftJoin(schema.governanceModuleTable, DAO_GOVERNANCE_MODULE_JOIN_CONDITION)
    .where(nameQueryParam ? sql`${schema.daoTable.name} ilike ${`%${nameQueryParam}%`}` : undefined)
    .orderBy(asc(schema.daoTable.chainId));
  return resf(c, daos);
});

/**
 * @title Get all DAOs for a specific chain
 * @route GET /d/{chainId}
 * @param {string} chainId - Chain ID parameter
 * @returns {Dao[]} Array of DAO objects
 */
app.get('/:chainId', async c => {
  const { chainId } = c.req.param();
  const chainIdNumber = getChainId(chainId);
  const daos = await db
    .select(DAO_SELECT_FIELDS)
    .from(schema.daoTable)
    .leftJoin(schema.governanceModuleTable, DAO_GOVERNANCE_MODULE_JOIN_CONDITION)
    .where(sql`${schema.daoTable.chainId} = ${chainIdNumber}`);

  return resf(c, daos);
});

/**
 * @title Get a DAO by chain ID and address
 * @route GET /d/{chainId}/{address}
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @returns {Dao} DAO object
 */
app.get('/:chainId/:address', daoFetch, async c => {
  const dao = c.get('dao');
  return resf(c, dao);
});

/**
 * @title Fetch all Safe proposals from Safe API and save to our DB
 * @route POST /d/{chainId}/{address}/safe-proposals
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @returns {SafeProposal[]} Array of Safe proposal objects
 */
app.post('/:chainId/:address/safe-proposals', daoExists, async c => {
  const dao = c.get('basicDaoInfo');
  if (dao.isAzorius) throw new ApiError('DAO is not a Safe DAO', 400);

  // Return immediately; run update in background to avoid timeout.
  (async () => {
    // const latestProposal = await db.query.safeProposalTable.findFirst({
    //   where: (safeProposal, { eq, and }) =>
    //     and(eq(safeProposal.daoChainId, dao.chainId), eq(safeProposal.daoAddress, dao.address)),
    //   orderBy: (safeProposal, { desc }) => desc(safeProposal.submissionDate),
    // });
    // const since = latestProposal
    //   ? new Date(latestProposal.submissionDate.getTime() + 1)
    //   : undefined;
    // TODO: add back since to do pagination if this get too slow?
    const transactions = await getSafeTransactions(dao.chainId, dao.address);
    if (transactions.results.length === 0) return resf(c, []);

    const proposals: DbSafeProposal[] = await Promise.all(
      transactions.results.map(async t => {
        const proposer = (t.proposer || t.confirmations?.[0]?.owner) as `0x${string}`;
        const safeTxHash = t.safeTxHash as `0x${string}`;
        const cid = getCIDFromSafeTransaction(t);
        const metadata = cid ? await fetchMetadata(cid) : { title: null, description: null };
        const { title, description } = metadata;
        const submissionDate = new Date(t.submissionDate);
        return {
          daoChainId: dao.chainId,
          daoAddress: dao.address,
          safeNonce: t.nonce,
          title,
          description,
          proposer,
          metadataCID: cid,
          dataDecoded: t.dataDecoded,
          safeTxHash,
          submissionDate,
          transactionTo: t.to as Hex,
          transactionValue: t.value,
          transactionData: t.data as Hex,
          confirmations: t.confirmations,
          confirmationsRequired: t.confirmationsRequired,
        };
      }),
    );

    await db
      .insert(schema.safeProposalTable)
      .values(proposals)
      .onConflictDoUpdate({
        target: [
          schema.safeProposalTable.daoChainId,
          schema.safeProposalTable.daoAddress,
          schema.safeProposalTable.safeTxHash,
        ],
        set: {
          title: sql.raw(`excluded.${schema.safeProposalTable.title.name}`),
          description: sql.raw(`excluded.${schema.safeProposalTable.description.name}`),
          proposer: sql.raw(`excluded.${schema.safeProposalTable.proposer.name}`),
          metadataCID: sql.raw(`excluded.${schema.safeProposalTable.metadataCID.name}`),
          dataDecoded: sql.raw(`excluded.${schema.safeProposalTable.dataDecoded.name}`),
          submissionDate: sql.raw(`excluded.${schema.safeProposalTable.submissionDate.name}`),
          transactionTo: sql.raw(`excluded.${schema.safeProposalTable.transactionTo.name}`),
          transactionValue: sql.raw(`excluded.${schema.safeProposalTable.transactionValue.name}`),
          transactionData: sql.raw(`excluded.${schema.safeProposalTable.transactionData.name}`),
          confirmations: sql.raw(`excluded.${schema.safeProposalTable.confirmations.name}`),
          confirmationsRequired: sql.raw(
            `excluded.${schema.safeProposalTable.confirmationsRequired.name}`,
          ),
        },
      });
  })();

  return resf(c, 'Task scheduled');
});

/**
 * @title Get my permissions for a DAO
 * @route GET /d/{chainId}/{address}/me
 * @param {string} chainId - Chain ID parameter
 * @param {string} address - Address parameter
 * @returns {User} User object
 */
app.get('/:chainId/:address/me', daoExists, bearerAuth, permissionsCheck, async c => {
  const user = c.get('user');
  if (!user) throw new ApiError('User not found', 401);
  return resf(c, user);
});

export default app;
