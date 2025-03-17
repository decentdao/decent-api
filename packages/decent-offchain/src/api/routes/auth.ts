import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { generateSiweNonce, parseSiweMessage } from "viem/siwe";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { schema } from "@/db/schema";
import { db } from "@/db";
import resf from "@/api/utils/responseFormatter";
import { publicClient } from "@/api/utils/publicClient";
const app = new Hono();

const cookieName = "decent-session";
const cookieOptions = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
} as const;

app.get("/nonce", async (c) => {
  const id = getCookie(c, cookieName) || nanoid();
  const [session] = await db.select()
    .from(schema.sessions)
    .where(eq(schema.sessions.id, id));
  
    const nonce = session?.nonce || generateSiweNonce();

  if (!session?.nonce) {
    await db.insert(schema.sessions).values({
      id,
      nonce,
    });
    setCookie(c, cookieName, id, cookieOptions);
  }

  return resf(c, { nonce });
});

app.post("/verify", async (c) => {
  const id = getCookie(c, cookieName);
  if (!id) return resf(c, { error: "Session not found" }, 401);

  const [session] = await db.select().from(schema.sessions).where(eq(schema.sessions.id, id));
  if (!session) return resf(c, { error: "Session not found" }, 401);
  
  const { message, signature } = await c.req.json();

  const { address, nonce } = parseSiweMessage(message);
  if (!nonce) return resf(c, { error: "Invalid nonce" }, 401);

  const success = await publicClient.verifySiweMessage({
    message,
    signature,
    nonce,
    address,
  });
  
  if (!success) return resf(c, { error: "Invalid signature" }, 401);

  await db.update(schema.sessions).set({
    address,
    nonce,
  }).where(eq(schema.sessions.id, id));

  return resf(c, { success: true });
});

app.get("/me", async (c) => {
  const id = getCookie(c, cookieName);
  if (!id) return resf(c, { error: "Session not found" }, 401);

  const [session] = await db.select().from(schema.sessions).where(eq(schema.sessions.id, id));
  if (!session) return resf(c, { error: "Session not found" }, 401);
  if (!session.address) return resf(c, { error: "Address not found" }, 401);
  return resf(c, { session });
});

app.post("/logout", async (c) => {
  const id = getCookie(c, cookieName);
  if (!id) return resf(c, { error: "Session not found" }, 401);

  await db.delete(schema.sessions).where(eq(schema.sessions.id, id));
  return resf(c, { success: true });
});

export default app;
