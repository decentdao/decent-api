import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const hosted = process.env.DATABASE_URL;
console.log(!!hosted && "DB HOSTED");

export const connectionString =
  hosted ||
  `postgres://${process.env.USER}@localhost:5432/decent`;

const client = new Pool({ connectionString });

export const db = drizzle({ client, schema, casing: "snake_case" });
