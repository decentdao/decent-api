import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import jsonf from "@/api/utils/responseFormatter";
import { daos } from "@/db/schema";
const app = new Hono();

app.get("/", async (c) => {
  const query = await db.select().from(daos);
  return jsonf(c, query);
});

app.get("/:dao", async (c) => {
  const dao = c.req.param("dao");
  const query = await db.select().from(daos).where(eq(daos.dao, dao));
  if (query.length === 0) {
    throw new Error("DAO not found");
  }
  return jsonf(c, query[0]);
});

export default app;
