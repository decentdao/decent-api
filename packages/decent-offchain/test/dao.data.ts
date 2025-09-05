import { DEFAULT_DAO_WITH } from '@/db/queries';
import { db } from '../src/db';
import {
  daoTable,
  governanceModuleTable,
  votingStrategyTable,
  votingTokenTable,
  DbDao,
} from '../src/db/schema/onchain';
import { daoAddress, daoChainId } from './constants';

async function insertDaoData() {
  try {
    // Insert DAO
    await db
      .insert(daoTable)
      .values({
        chainId: daoChainId,
        address: daoAddress,
        name: 'decent-api',
        createdAt: 1744234225,
        creatorAddress: '0x25910143c255828f623786f46fe9a8941b7983bb'
      })
      .onConflictDoNothing();

    // Insert Governance Module
    await db
      .insert(governanceModuleTable)
      .values({
        address: '0xd0cbdf4b48d3abc9cc3df373ed2f0f91a38c954c',
        daoChainId: daoChainId,
        daoAddress: daoAddress,
      })
      .onConflictDoNothing();

    // Insert Voting Strategy
    await db
      .insert(votingStrategyTable)
      .values({
        address: '0xe6d3d6c70f22459a98985a998f1a1ddf0949e0d0',
        governanceModuleId: '0xd0cbdf4b48d3abc9cc3df373ed2f0f91a38c954c',
        requiredProposerWeight: 1,
      })
      .onConflictDoNothing();

    // Insert Voting Token
    await db
      .insert(votingTokenTable)
      .values({
        address: '0x4e885bf7370499074ef59df80be1f97b590066e2',
        votingStrategyId: '0xe6d3d6c70f22459a98985a998f1a1ddf0949e0d0',
        type: 'ERC20',
      })
      .onConflictDoNothing();

    console.log('Successfully inserted DAO data');
    const dao = (await db.query.daoTable.findFirst({
      where: (dao, { eq, and }) => and(eq(dao.chainId, daoChainId), eq(dao.address, daoAddress)),
      with: DEFAULT_DAO_WITH,
    })) as DbDao | undefined;
    console.log(dao);
  } catch (error) {
    console.error('Error inserting DAO data:', error);
    throw error;
  }
}

// Run the insert function
insertDaoData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
