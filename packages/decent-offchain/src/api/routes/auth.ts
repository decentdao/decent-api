import { Hono } from "hono";
import { nanoid } from "nanoid";
import resf from "@/api/utils/responseFormatter";

const app = new Hono();

app.get("/nonce", async (c) => {
  const nonce =  nanoid();
  return resf(c, { nonce });
});

export default app;
