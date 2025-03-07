import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { eq, graphql } from "ponder";

const app = new Hono();

app.use("/graphql", graphql({ db, schema }));

app.get("/dao/:dao", async (c) => {
  const query = c.req.param("dao");

  const dao = await db.select()
    .from(schema.keyValuePair)
    .where(eq(schema.keyValuePair.dao, query));

  if (dao.length === 0) {
    return c.json({ error: "DAO not found" }, 404);
  }

  return c.json(dao[0]);
});

app.get("/count", async (c) => {
  const count = await db.$count(schema.keyValuePair);

  return c.json({ count });
});

export default app;
