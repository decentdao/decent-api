import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  driver: "pglite",
  schema: "./src/db/schema/*",
  out: "./drizzle",
  dbCredentials: {
    url: "../decent-ponder/.ponder/pglite",
  },
  strict: true,
  schemaFilter: ["offchain"],
});
