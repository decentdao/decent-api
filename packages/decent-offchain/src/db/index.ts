import { drizzle } from "drizzle-orm/pglite";
import { proposals } from "./schema/proposals";
import { PGlite } from "@electric-sql/pglite";

const client = new PGlite({
  dataDir: Bun.env.DATABASE_URL ?? "",
});

export const db = drizzle({
  client,
  schema: {
    proposals,
  },
});
