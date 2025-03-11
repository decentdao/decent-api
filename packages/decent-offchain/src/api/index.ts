import { Hono } from "hono";
import { db } from "../db";
import { proposals } from "../db/schema/proposals";

const app = new Hono();

app.get("/", (c) => c.text("Hello, World!"));

app.post("/proposals", async (c) => {
  const { title, body, dao } = await c.req.json();
  const proposal = await db.insert(proposals).values({ title, body, dao });
  return c.json(proposal);
});

export default app;
