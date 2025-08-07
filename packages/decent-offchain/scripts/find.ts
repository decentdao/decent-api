#!/usr/bin/env bun

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { onchainProposalTable, votingStrategyTable, votingTokenTable } from '../src/db/schema/onchain';

// Database connections
const DATABASE_URL = process.env.DATABASE_URL;
const LOCAL_DB = 'postgresql://eddie:postgres@localhost:5432/decent';

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

// Create database connections
const remoteClient = new Pool({ connectionString: DATABASE_URL });
const localClient = new Pool({ connectionString: LOCAL_DB });

const remoteDb = drizzle({
  client: remoteClient,
  casing: 'snake_case',
});

const localDb = drizzle({
  client: localClient,
  casing: 'snake_case',
});

// Helper function to hide sensitive parts of connection string
const hideCredentials = (str: string) => str.replace(/:(.*?)@/, ':****@');

interface ProposalComparison {
  id: number;
  daoChainId: number;
  daoAddress: string;
  differences: Record<string, { remote: any; local: any }>;
}

interface VotingStrategyComparison {
  address: string;
  differences: Record<string, { remote: any; local: any }>;
}

interface VotingTokenComparison {
  address: string;
  votingStrategyId: string;
  differences: Record<string, { remote: any; local: any }>;
}

async function fetchAllProposals(db: any, dbName: string) {
  console.log(`Fetching proposals from ${dbName}...`);
  try {
    const proposals = await db.select().from(onchainProposalTable);
    console.log(`Found ${proposals.length} proposals in ${dbName}`);
    return proposals;
  } catch (error) {
    console.error(`Error fetching proposals from ${dbName}:`, error);
    return [];
  }
}

async function fetchAllVotingStrategies(db: any, dbName: string) {
  console.log(`Fetching voting strategies from ${dbName}...`);
  try {
    const votingStrategies = await db.select().from(votingStrategyTable);
    console.log(`Found ${votingStrategies.length} voting strategies in ${dbName}`);
    return votingStrategies;
  } catch (error) {
    console.error(`Error fetching voting strategies from ${dbName}:`, error);
    return [];
  }
}

async function fetchAllVotingTokens(db: any, dbName: string) {
  console.log(`Fetching voting tokens from ${dbName}...`);
  try {
    const votingTokens = await db.select().from(votingTokenTable);
    console.log(`Found ${votingTokens.length} voting tokens in ${dbName}`);
    return votingTokens;
  } catch (error) {
    console.error(`Error fetching voting tokens from ${dbName}:`, error);
    return [];
  }
}

function compareProposals(remoteProposals: any[], localProposals: any[]) {
  const inconsistencies: ProposalComparison[] = [];

  // Create maps for efficient lookup
  const remoteMap = new Map();
  const localMap = new Map();

  // Build maps using composite key (id + daoChainId + daoAddress)
  remoteProposals.forEach(proposal => {
    const key = `${proposal.id}-${proposal.daoChainId}-${proposal.daoAddress}`;
    remoteMap.set(key, proposal);
  });

  localProposals.forEach(proposal => {
    const key = `${proposal.id}-${proposal.daoChainId}-${proposal.daoAddress}`;
    localMap.set(key, proposal);
  });

  // Find proposals that exist in remote but not in local
  remoteMap.forEach((remoteProposal, key) => {
    if (!localMap.has(key)) {
      inconsistencies.push({
        id: remoteProposal.id,
        daoChainId: remoteProposal.daoChainId,
        daoAddress: remoteProposal.daoAddress,
        differences: {
          existence: { remote: 'EXISTS', local: 'MISSING' },
        },
      });
    }
  });

  // Find proposals that exist in local but not in remote
  localMap.forEach((localProposal, key) => {
    if (!remoteMap.has(key)) {
      inconsistencies.push({
        id: localProposal.id,
        daoChainId: localProposal.daoChainId,
        daoAddress: localProposal.daoAddress,
        differences: {
          existence: { remote: 'MISSING', local: 'EXISTS' },
        },
      });
    }
  });

  // Compare proposals that exist in both databases
  localMap.forEach((localProposal, key) => {
    if (remoteMap.has(key)) {
      const remoteProposal = remoteMap.get(key);
      const differences: Record<string, { remote: any; local: any }> = {};

      // Compare all fields except potentially auto-generated ones
      const fieldsToCompare = [
        'proposer',
        'votingStrategyAddress',
        'transactions',
        'decodedTransactions',
        'title',
        'description',
        'createdAt',
        'proposedTxHash',
        'executedTxHash',
      ];

      fieldsToCompare.forEach(field => {
        const remoteValue = remoteProposal[field];
        const localValue = localProposal[field];

        // Handle JSON fields specially
        if (field === 'transactions' || field === 'decodedTransactions') {
          if (JSON.stringify(remoteValue) !== JSON.stringify(localValue)) {
            differences[field] = { remote: remoteValue, local: localValue };
          }
        } else if (remoteValue !== localValue) {
          differences[field] = { remote: remoteValue, local: localValue };
        }
      });

      if (Object.keys(differences).length > 0) {
        inconsistencies.push({
          id: localProposal.id,
          daoChainId: localProposal.daoChainId,
          daoAddress: localProposal.daoAddress,
          differences,
        });
      }
    }
  });

  return inconsistencies;
}

function compareVotingStrategies(remoteVotingStrategies: any[], localVotingStrategies: any[]) {
  const inconsistencies: VotingStrategyComparison[] = [];

  // Create maps for efficient lookup
  const remoteMap = new Map();
  const localMap = new Map();

  // Build maps using address as key
  remoteVotingStrategies.forEach(strategy => {
    remoteMap.set(strategy.address, strategy);
  });

  localVotingStrategies.forEach(strategy => {
    localMap.set(strategy.address, strategy);
  });

  // Find strategies that exist in remote but not in local
  remoteMap.forEach((remoteStrategy, address) => {
    if (!localMap.has(address)) {
      inconsistencies.push({
        address,
        differences: {
          existence: { remote: 'EXISTS', local: 'MISSING' },
        },
      });
    }
  });

  // Find strategies that exist in local but not in remote
  localMap.forEach((localStrategy, address) => {
    if (!remoteMap.has(address)) {
      inconsistencies.push({
        address,
        differences: {
          existence: { remote: 'MISSING', local: 'EXISTS' },
        },
      });
    }
  });

  // Compare strategies that exist in both databases
  localMap.forEach((localStrategy, address) => {
    if (remoteMap.has(address)) {
      const remoteStrategy = remoteMap.get(address);
      const differences: Record<string, { remote: any; local: any }> = {};

      // Compare all fields
      const fieldsToCompare = [
        'governanceModuleId',
      ];

      fieldsToCompare.forEach(field => {
        const remoteValue = remoteStrategy[field];
        const localValue = localStrategy[field];

        if (remoteValue !== localValue) {
          differences[field] = { remote: remoteValue, local: localValue };
        }
      });

      if (Object.keys(differences).length > 0) {
        inconsistencies.push({
          address,
          differences,
        });
      }
    }
  });

  return inconsistencies;
}

function compareVotingTokens(remoteVotingTokens: any[], localVotingTokens: any[]) {
  const inconsistencies: VotingTokenComparison[] = [];

  // Create maps for efficient lookup
  const remoteMap = new Map();
  const localMap = new Map();

  // Build maps using address as key
  remoteVotingTokens.forEach(token => {
    remoteMap.set(token.address, token);
  });

  localVotingTokens.forEach(token => {
    localMap.set(token.address, token);
  });

  // Find tokens that exist in remote but not in local
  remoteMap.forEach((remoteToken, address) => {
    if (!localMap.has(address)) {
      inconsistencies.push({
        address,
        votingStrategyId: remoteToken.votingStrategyId,
        differences: {
          existence: { remote: 'EXISTS', local: 'MISSING' },
        },
      });
    }
  });

  // Find tokens that exist in local but not in remote
  localMap.forEach((localToken, address) => {
    if (!remoteMap.has(address)) {
      inconsistencies.push({
        address,
        votingStrategyId: localToken.votingStrategyId,
        differences: {
          existence: { remote: 'MISSING', local: 'EXISTS' },
        },
      });
    }
  });

  // Compare tokens that exist in both databases
  localMap.forEach((localToken, address) => {
    if (remoteMap.has(address)) {
      const remoteToken = remoteMap.get(address);
      const differences: Record<string, { remote: any; local: any }> = {};

      // Compare all fields
      const fieldsToCompare = [
        'votingStrategyId',
        'type',
      ];

      fieldsToCompare.forEach(field => {
        const remoteValue = remoteToken[field];
        const localValue = localToken[field];

        if (remoteValue !== localValue) {
          differences[field] = { remote: remoteValue, local: localValue };
        }
      });

      if (Object.keys(differences).length > 0) {
        inconsistencies.push({
          address,
          votingStrategyId: localToken.votingStrategyId,
          differences,
        });
      }
    }
  });

  return inconsistencies;
}

async function main() {
  console.log('🔍 Starting database comparison...');
  console.log(`Remote DB: ${hideCredentials(DATABASE_URL!)}`);
  console.log(`Local DB:  ${hideCredentials(LOCAL_DB)}`);
  console.log('');

  try {
    // Test connections
    console.log('Testing database connections...');
    await remoteClient.query('SELECT 1');
    await localClient.query('SELECT 1');
    console.log('✅ Both database connections successful\n');

    // Fetch data from both databases
    const [remoteProposals, localProposals] = await Promise.all([
      fetchAllProposals(remoteDb, 'remote'),
      fetchAllProposals(localDb, 'local'),
    ]);

    const [remoteVotingStrategies, localVotingStrategies] = await Promise.all([
      fetchAllVotingStrategies(remoteDb, 'remote'),
      fetchAllVotingStrategies(localDb, 'local'),
    ]);

    const [remoteVotingTokens, localVotingTokens] = await Promise.all([
      fetchAllVotingTokens(remoteDb, 'remote'),
      fetchAllVotingTokens(localDb, 'local'),
    ]);

    console.log('');

    // Compare data
    console.log('🔄 Comparing data...');
    const proposalInconsistencies = compareProposals(remoteProposals, localProposals);
    const votingStrategyInconsistencies = compareVotingStrategies(remoteVotingStrategies, localVotingStrategies);
    const votingTokenInconsistencies = compareVotingTokens(remoteVotingTokens, localVotingTokens);

    console.log('');
    console.log('📊 COMPARISON RESULTS:');
    console.log('='.repeat(50));

    // Display proposal inconsistencies
    if (proposalInconsistencies.length === 0) {
      console.log('✅ No proposal inconsistencies found!');
    } else {
      console.log(`❌ Found ${proposalInconsistencies.length} proposal inconsistencies:`);
      console.log('');

      proposalInconsistencies.forEach((inconsistency, index) => {
        console.log(
          `${index + 1}. Proposal ID: ${inconsistency.id}, DAO Chain: ${inconsistency.daoChainId}, DAO Address: ${inconsistency.daoAddress}`,
        );

        Object.entries(inconsistency.differences).forEach(([field, { remote, local }]) => {
          console.log(`   ${field}:`);
          console.log(`     Remote: ${JSON.stringify(remote)}`);
          console.log(`     Local:  ${JSON.stringify(local)}`);
        });
        console.log('');
      });
    }

    // Display voting strategy inconsistencies
    if (votingStrategyInconsistencies.length === 0) {
      console.log('✅ No voting strategy inconsistencies found!');
    } else {
      console.log(`❌ Found ${votingStrategyInconsistencies.length} voting strategy inconsistencies:`);
      console.log('');

      votingStrategyInconsistencies.forEach((inconsistency, index) => {
        console.log(`${index + 1}. Voting Strategy Address: ${inconsistency.address}`);

        Object.entries(inconsistency.differences).forEach(([field, { remote, local }]) => {
          console.log(`   ${field}:`);
          console.log(`     Remote: ${JSON.stringify(remote)}`);
          console.log(`     Local:  ${JSON.stringify(local)}`);
        });
        console.log('');
      });
    }

    // Display voting token inconsistencies
    if (votingTokenInconsistencies.length === 0) {
      console.log('✅ No voting token inconsistencies found!');
    } else {
      console.log(`❌ Found ${votingTokenInconsistencies.length} voting token inconsistencies:`);
      console.log('');

      votingTokenInconsistencies.forEach((inconsistency, index) => {
        console.log(`${index + 1}. Voting Token Address: ${inconsistency.address}, Strategy: ${inconsistency.votingStrategyId}`);

        Object.entries(inconsistency.differences).forEach(([field, { remote, local }]) => {
          console.log(`   ${field}:`);
          console.log(`     Remote: ${JSON.stringify(remote)}`);
          console.log(`     Local:  ${JSON.stringify(local)}`);
        });
        console.log('');
      });
    }

    // Summary statistics
    console.log('📈 SUMMARY:');
    console.log(`Remote database proposals: ${remoteProposals.length}`);
    console.log(`Local database proposals:  ${localProposals.length}`);
    console.log(`Remote database voting strategies: ${remoteVotingStrategies.length}`);
    console.log(`Local database voting strategies:  ${localVotingStrategies.length}`);
    console.log(`Remote database voting tokens: ${remoteVotingTokens.length}`);
    console.log(`Local database voting tokens:  ${localVotingTokens.length}`);
    console.log(`Total inconsistencies found: ${proposalInconsistencies.length + votingStrategyInconsistencies.length + votingTokenInconsistencies.length}`);
  } catch (error) {
    console.error('❌ Error during comparison:', error);
    process.exit(1);
  } finally {
    // Close connections
    await remoteClient.end();
    await localClient.end();
    console.log('\n🔒 Database connections closed.');
  }
}

// Run the script
main().catch(console.error);
