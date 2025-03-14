import { defineConfig } from "drizzle-kit";
import { connectionString } from ".";

export default defineConfig({
  dialect: "postgresql",
  schema: [
    "./src/db/schema/proposals.ts"
  ],
  out: "./drizzle",
  dbCredentials: {
    url: connectionString,
  },
  casing: "snake_case",
  schemaFilter: ["offchain"],
});
