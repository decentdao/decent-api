import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { schema } from "@/db/schema";
import resf from "@/api/utils/responseFormatter";

const app = new Hono();

app.get("/", async (c) => {
  const query = await db.select().from(schema.daos);
  return resf(c, query);
});

app.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const query = await db.select().from(schema.daos).where(eq(schema.daos.slug, slug));
  if (query.length === 0) {
    throw new Error("DAO not found");
  }
  return resf(c, query[0]);
});

export default app;
