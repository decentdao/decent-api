import { isAddress } from 'viem';
import { Context, ponder } from 'ponder:registry';
import { fetchGovernance } from './fetch';
import {
  dao,
  DaoInsert,
  governanceModule,
  signer,
  signerToDao,
  votingStrategy,
  votingToken,
  hatIdToStreamId,
  HatIdToStreamIdInsert
} from 'ponder:schema';

const handleGovernanceData = async (
  entry: DaoInsert,
  context: Context,
  timestamp: bigint,
) => {
  const { address } = entry;

  let governance = null;
  governance = await fetchGovernance(context, address);
  entry.guardAddress = governance.guard;
  entry.fractalModuleAddress = governance.fractalModuleAddress;
  entry.requiredSignatures = governance.threshold;

  await context.db.insert(dao).values({ ...entry, createdAt: timestamp }).onConflictDoUpdate({
    ...entry,
    updatedAt: timestamp,
  });

  if (governance.governanceModules.length > 0) {
    await context.db.insert(governanceModule).values(
      governance.governanceModules
    ).onConflictDoNothing();
  }

  if (governance.votingStrategies.length > 0) {
    await context.db.insert(votingStrategy).values(
      governance.votingStrategies
    ).onConflictDoNothing();
  }

  if (governance.votingTokens.length > 0) {
    await context.db.insert(votingToken).values(
      governance.votingTokens
    ).onConflictDoNothing();
  }

  if (governance.signers.length > 0) {
    await context.db.insert(signer).values(
      governance.signers
    ).onConflictDoNothing();
  }

  if (governance.signerToDaos.length > 0) {
    await context.db.insert(signerToDao).values(
      governance.signerToDaos
    ).onConflictDoNothing();
  }
};

ponder.on('ZodiacModules:ProposalCreated', async ({ event, context }) => {
  // 1. validate if it's Azorius modules which attached to Decent DAOs
  console.debug("event", event);
});
