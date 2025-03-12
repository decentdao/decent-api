import { defineConfig } from "drizzle-kit";
import { connectionString } from ".";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/*",
  out: "./drizzle",
  dbCredentials: {
    url: connectionString,
  },
  strict: true,
  schemaFilter: ["offchain"],
});
