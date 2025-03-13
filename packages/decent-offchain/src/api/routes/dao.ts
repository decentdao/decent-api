import { Hono } from "hono";
import { db } from "@/db";
import jsonf from "@/api/utils/responseFormatter";

const app = new Hono();

app.get("/", async (c) => {
  const query = await db.$client.query("SELECT * FROM daos");
  const daos = query.rows;
  return jsonf(c, daos);
});

export default app;
