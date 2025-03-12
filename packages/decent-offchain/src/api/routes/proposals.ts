import { Hono } from "hono";
import { db } from "@/db";
import * as schema from "@/db/schema";
import json from "@/api/utils/responseFormatter";
const app = new Hono();

app.get("/", async (c) => {
  const proposals = await db.select().from(schema.proposals);
  return json(c, proposals);
});

export default app;
