import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { proposals } from "./schema/proposals";

const connectionString = process.env.DATABASE_URL;
const client = new Pool({ connectionString });

export const db = drizzle({
  client,
  schema: {
    proposals,
  },
});
