import { Context, Event, ponder } from "ponder:registry";
import { daos, DaoInsert } from "ponder:schema";
import { chainIdToPrefix } from "./networks";
import { fetchGovernance } from "./fetch";
import { Address } from "viem";

const getGovernanceFormatEntry = async (
  event: Event,
  context: Context,
  safeAddress: Address
): Promise<DaoInsert> => {
  const timestamp = Number(event.block.timestamp);
  const prefix = chainIdToPrefix(context.network.chainId);
  const dao = `${prefix}:${safeAddress}`;
  const entry: DaoInsert = { dao, createdAt: timestamp };
  const daoInfo = await context.db.find(daos, { dao });

  if (!daoInfo?.signers) {
    const governance = await fetchGovernance(context, safeAddress);
    entry.azoriusModuleAddress = governance.modules;
    entry.signers = governance.owners;
    entry.requiredSignatures = governance.threshold;
    entry.votingStrategyAddress = governance.strategies;
    entry.votingToken = governance.tokens;
  }

  return entry;
};

// KeyValuePairs is a generic key value store for Decent
// Subgraph: https://github.com/decentdao/decent-subgraph/blob/main/src/key-value-pairs.ts
// Contract: https://github.com/decentdao/decent-contracts/blob/develop/contracts/singletons/KeyValuePairs.sol
ponder.on("KeyValuePairs:ValueUpdated", async ({ event, context }) => {
  const { theAddress: safeAddress, key, value } = event.args;
  // confirm safeAddress is a valid safe address
  const entry = await getGovernanceFormatEntry(event, context, safeAddress);
  const updatedAt = entry.createdAt;
  if (key === "daoName") {
    await context.db.insert(daos)
      .values({ ...entry, daoName: value })
      .onConflictDoUpdate({ daoName: value, updatedAt });
  
  } else if (key === "proposalTemplates") {
    await context.db.insert(daos)
      .values({ ...entry, proposalTemplatesCID: value })
      .onConflictDoUpdate({ proposalTemplatesCID: value, updatedAt });
  
  } else if (key === "snapshotENS" || key === "snapshotURL") {
    const cleanedValue = value === "" ? null : value;
    await context.db.insert(daos)
      .values({ ...entry, snapshotENS: cleanedValue })
      .onConflictDoUpdate({ snapshotENS: cleanedValue, updatedAt });
  
  } else if (key === "childDao") {
    const prefix = chainIdToPrefix(context.network.chainId);
    const subDaoOf = entry.dao;
    entry.dao = `${prefix}:${value}`
    await context.db.insert(daos)
      .values({ ...entry, subDaoOf })
      .onConflictDoNothing();

  } else if (key === "topHatId") {
    await context.db.insert(daos)
      .values({ ...entry, topHatId: value })
      .onConflictDoUpdate({ topHatId: value, updatedAt });
  
  } else if (key === "hatIdToStreamId") {
    await context.db.insert(daos)
      .values({ ...entry, hatIdToStreamId: value })
      .onConflictDoUpdate({ hatIdToStreamId: value, updatedAt });
  
  } else if (key === "gaslessVotingEnabled") {
    await context.db.insert(daos)
      .values({ ...entry, gaslessVotingEnabled: value === "true" })
      .onConflictDoUpdate({ gaslessVotingEnabled: value === "true", updatedAt });
    
  } else {
    console.log("--------------------------------");
    console.log("Unknown key:", key);
    console.log("Network:", context.network.chainId);
    console.log("DAO:", entry.dao);
    console.log("Value:", value);
    console.log("--------------------------------");
  }
});

// Decent used to be called Fractal and used this event to set the dao name
// Subgraph: https://github.com/decentdao/decent-subgraph/blob/main/src/fractal-registry.ts
// Contract: https://github.com/decentdao/decent-contracts/blob/87b74fc69c788709bb606c59e41cf5a365506b06/contracts/FractalRegistry.sol
ponder.on("FractalRegistry:FractalNameUpdated", async ({ event, context }) => {
  const { daoAddress, daoName } = event.args;
  const entry = await getGovernanceFormatEntry(event, context, daoAddress);
  const updatedAt = entry.createdAt;

  await context.db.insert(daos)
    .values({ ...entry, daoName })
    .onConflictDoUpdate({ daoName, updatedAt });
});

ponder.on("FractalRegistry:FractalSubDAODeclared", async ({ event, context }) => {
  const { parentDAOAddress, subDAOAddress } = event.args;
  const entry = await getGovernanceFormatEntry(event, context, subDAOAddress);
  const updatedAt = entry.createdAt;
  const prefix = chainIdToPrefix(context.network.chainId);

  await context.db.insert(daos)
    .values({ ...entry, subDaoOf: `${prefix}:${parentDAOAddress}` })
    .onConflictDoUpdate({ subDaoOf: `${prefix}:${parentDAOAddress}`, updatedAt });
});
