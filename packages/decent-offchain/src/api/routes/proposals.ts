import { Hono } from "hono";
import { db } from "@/db";
import { schema } from "@/db/schema";
import resf from "@/api/utils/responseFormatter";

const app = new Hono();

app.get("/", async (c) => {
  const proposals = await db.select().from(schema.proposals);

  return resf(c, proposals);
});

export default app;
 