import { ponder } from "ponder:registry";
import { daos } from "ponder:schema";
import { chainIdToPrefix } from "./networks";

// KeyValuePairs is a generic key value store for Decent
// Subgraph
// https://github.com/decentdao/decent-subgraph/blob/main/src/key-value-pairs.ts
// Contract
// https://github.com/decentdao/decent-contracts/blob/develop/contracts/singletons/KeyValuePairs.sol
ponder.on("KeyValuePairs:ValueUpdated", async ({ event, context }) => {
  const { theAddress: dao, key, value } = event.args;
  const timestamp = Number(event.block.timestamp);
  const prefix = chainIdToPrefix(context.network.chainId);
  const entry = { dao: `${prefix}:${dao}`, createdAt: timestamp };

  if (key === "daoName") {
    await context.db.insert(daos)
      .values({ ...entry, daoName: value })
      .onConflictDoUpdate({ daoName: value, updatedAt: timestamp });
  
  } else if (key === "proposalTemplates") {
    await context.db.insert(daos)
      .values({ ...entry, proposalTemplatesCID: value })
      .onConflictDoUpdate({ proposalTemplatesCID: value, updatedAt: timestamp });
  
  } else if (key === "snapshotENS" || key === "snapshotURL") {
    const cleanedValue = value === "" ? null : value;
    await context.db.insert(daos)
      .values({ ...entry, snapshotENS: cleanedValue })
      .onConflictDoUpdate({ snapshotENS: cleanedValue, updatedAt: timestamp });
  
  } else if (key === "childDao") {
    entry.dao = `${prefix}:${value}`;
    await context.db.insert(daos)
      .values({ ...entry, subDaoOf: dao })
      .onConflictDoNothing();

  } else if (key === "topHatId") {
    await context.db.insert(daos)
      .values({ ...entry, topHatId: value })
      .onConflictDoUpdate({ topHatId: value, updatedAt: timestamp });
  
  } else if (key === "hatIdToStreamId") {
    await context.db.insert(daos)
      .values({ ...entry, hatIdToStreamId: value })
      .onConflictDoUpdate({ hatIdToStreamId: value, updatedAt: timestamp });
  
  } else if (key === "gaslessVotingEnabled") {
    await context.db.insert(daos)
      .values({ ...entry, gaslessVotingEnabled: value === "true" })
      .onConflictDoUpdate({ gaslessVotingEnabled: value === "true", updatedAt: timestamp });
    
  } else {
    console.log("--------------------------------");
    console.log("Unknown key:", key);
    console.log("Network:", context.network.chainId);
    console.log("DAO:", dao);
    console.log("Value:", value);
    console.log("--------------------------------");
  }
});

// Decent used to be called Fractal and used this event to set the dao name
// Subgraph
// https://github.com/decentdao/decent-subgraph/blob/main/src/fractal-registry.ts
// Contract
// https://github.com/decentdao/decent-contracts/blob/87b74fc69c788709bb606c59e41cf5a365506b06/contracts/FractalRegistry.sol
ponder.on("FractalRegistry:FractalNameUpdated", async ({ event, context }) => {
  const { daoAddress, daoName } = event.args;
  const timestamp = Number(event.block.timestamp);
  const prefix = chainIdToPrefix(context.network.chainId);
  const entry = { dao: `${prefix}:${daoAddress}`, createdAt: timestamp };

  await context.db.insert(daos)
    .values({ ...entry, daoName })
    .onConflictDoUpdate({ daoName, updatedAt: timestamp });
});

ponder.on("FractalRegistry:FractalSubDAODeclared", async ({ event, context }) => {
  const { parentDAOAddress, subDAOAddress } = event.args;
  const timestamp = Number(event.block.timestamp);
  const prefix = chainIdToPrefix(context.network.chainId);
  const entry = { dao: `${prefix}:${subDAOAddress}`, createdAt: timestamp };

  await context.db.insert(daos)
    .values({ ...entry, subDaoOf: `${prefix}:${parentDAOAddress}` })
    .onConflictDoUpdate({ subDaoOf: `${prefix}:${parentDAOAddress}`, updatedAt: timestamp });
});
