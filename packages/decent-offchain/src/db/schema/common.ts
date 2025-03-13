import { pgSchema } from "drizzle-orm/pg-core";

export const offchainSchema = pgSchema("offchain");
export const onchainSchema = pgSchema("onchain");
