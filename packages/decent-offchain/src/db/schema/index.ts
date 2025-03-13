export * from "./proposals";
export * from "@decent-ponder/ponder.schema";
// import { daos } from "@decent-ponder/ponder.schema";
// import { relations } from "drizzle-orm";
// import { Table, is } from "drizzle-orm";
// import { proposals } from "./proposals";

// // Note: We need a separate file for merging the schemas because
// // "ponder.schema" can't be executed by drizzle-kit, and we also
// // don't want drizzle to generate migrations for onchain tables.

// // Note: `_ponderSchema` doesn't have information about which database schema
// // to use, so we need to set it manually.

// const setDatabaseSchema = <T extends { [name: string]: any }>(
//   schema: T,
//   schemaName: string,
// ): T => {
//   for (const table of Object.values(schema)) {
//     if (is(table, Table)) {
//       (table as any)[Symbol.for("drizzle:Schema")] = schemaName;
//     }
//   }
//   return schema;
// };

// const ponderSchema = daos.$inferSelect

// export const metadataRelations = relations(
//   proposals,
//   ({ one }) => ({
//     dao: one(ponderSchema., {
//       fields: [proposals.dao],
//       references: [ponderSchema.dao.dao],
//     }),
//   }),
// );

// export const schema = {
//   ...ponderSchema,
//   metadataRelations,
// };
