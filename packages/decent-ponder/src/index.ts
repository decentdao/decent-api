import { Context, Event, ponder } from "ponder:registry";
import { dao, DaoInsert } from "ponder:schema";
import { chainIdToPrefix } from "./networks";
import { fetchGovernance } from "./fetch";
import { Address, isAddress } from "viem";

const getGovernanceFormatEntry = async (
  event: Event,
  context: Context,
  address: Address
): Promise<DaoInsert> => {
  const createdAt = event.block.timestamp;
  const chainId = context.network.chainId;
  const entry: DaoInsert = { chainId, address, createdAt };
  const daoInfo = await context.db.sql.query.dao.findFirst({
    where: (dao, { eq }) => eq(dao.chainId, chainId) && eq(dao.address, address),
    with: {
      governanceModule: true,
      signers: true,
    }
  });
  if (!daoInfo?.signers && !daoInfo?.governanceModule) {
    const governance = await fetchGovernance(context, address);
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
    await context.db.insert(dao)
      .values({ ...entry, name: value })
      .onConflictDoUpdate({ name: value, updatedAt });
  
  } else if (key === "proposalTemplates") {
    await context.db.insert(dao)
      .values({ ...entry, proposalTemplatesCID: value })
      .onConflictDoUpdate({ proposalTemplatesCID: value, updatedAt });
  
  } else if (key === "snapshotENS" || key === "snapshotURL") {
    const cleanedValue = value === "" ? null : value;
    await context.db.insert(dao)
      .values({ ...entry, snapshotENS: cleanedValue })
      .onConflictDoUpdate({ snapshotENS: cleanedValue, updatedAt });
  
  } else if (key === "childDao") {
    if (!isAddress(value)) {
      console.log("--------------------------------");
      console.log("Unknown childDao:", value);
      console.log("Network:", context.network.chainId);
      console.log("DAO:", safeAddress);
      console.log("--------------------------------");
      return;
    }
    const subDaoOf = safeAddress;
    entry.address = value as Address;
    await context.db.insert(dao)
      .values({ ...entry, subDaoOf })
      .onConflictDoNothing();

  } else if (key === "topHatId") {
    await context.db.insert(dao)
      .values({ ...entry, topHatId: value })
      .onConflictDoUpdate({ topHatId: value, updatedAt });
  
  } else if (key === "hatIdToStreamId") {
    await context.db.insert(dao)
      .values({ ...entry, hatIdToStreamId: value })
      .onConflictDoUpdate({ hatIdToStreamId: value, updatedAt });
  
  } else if (key === "gaslessVotingEnabled") {
    await context.db.insert(dao)
      .values({ ...entry, gasTankEnabled: value === "true" })
      .onConflictDoUpdate({ gasTankEnabled: value === "true", updatedAt });
    
  } else {
    console.log("--------------------------------");
    console.log("Unknown key:", key);
    console.log("Network:", context.network.chainId);
    console.log(`DAO: ${entry.chainId}:${entry.address}`);
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

  await context.db.insert(dao)
    .values({ ...entry, name: daoName })
    .onConflictDoUpdate({ name: daoName, updatedAt });
});

ponder.on("FractalRegistry:FractalSubDAODeclared", async ({ event, context }) => {
  const { parentDAOAddress, subDAOAddress } = event.args;
  const entry = await getGovernanceFormatEntry(event, context, subDAOAddress);
  const updatedAt = entry.createdAt;

  await context.db.insert(dao)
    .values({ ...entry, subDaoOf: parentDAOAddress })
    .onConflictDoUpdate({ subDaoOf: parentDAOAddress, updatedAt });
});
