import { ponder } from "ponder:registry";
import { keyValuePair } from "ponder:schema";

ponder.on("KeyValuePairs:ValueUpdated", async ({ event, context }) => {
  const { theAddress: dao, key, value } = event.args;
  const chainId = context.network.chainId.toString();
  const timestamp = event.block.timestamp;

  const entry = { dao, chainId, createdAt: timestamp };

  if (key === "daoName") {
    await context.db.insert(keyValuePair)
      .values({ ...entry, daoName: value })
      .onConflictDoUpdate({ daoName: value, updatedAt: timestamp });
  
  } else if (key === "proposalTemplates") {
    await context.db.insert(keyValuePair)
      .values({ ...entry, proposalTemplates: value })
      .onConflictDoUpdate({ proposalTemplates: value, updatedAt: timestamp });
  
  } else if (key === "snapshotENS" || key === "snapshotURL") {
    await context.db.insert(keyValuePair)
      .values({ ...entry, snapshotENS: value })
      .onConflictDoUpdate({ snapshotENS: value, updatedAt: timestamp });
  
  } else {
    console.log("Unknown key:", key);
    console.log(value);
  }
});

