import { Hono } from "hono";
import { db } from "@/db";
import { schema } from "@/db/schema";
import resf from "@/api/utils/responseFormatter";

const app = new Hono();

app.get("/", async (c) => {
  const comments = await db.query.comments.findMany();

  return resf(c, comments);
});

export default app;
 