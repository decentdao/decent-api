import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { generateSiweNonce, parseSiweMessage } from "viem/siwe";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { schema } from "@/db/schema";
import { db } from "@/db";
import resf, { ApiError } from "@/api/utils/responseFormatter";
import { publicClient } from "@/api/utils/publicClient";
import { cookieName, cookieOptions } from "@/api/utils/cookie";
import { Me, Nonce, Logout } from "@/api/types";

const app = new Hono();

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

  const data: Nonce = { nonce };

  return resf(c, data);
});

app.post("/verify", async (c) => {
  const id = getCookie(c, cookieName);
  if (!id) throw new ApiError("no id found in cookie", 401);

  const [session] = await db.select().from(schema.sessions).where(eq(schema.sessions.id, id));
  if (!session) throw new ApiError("session not found", 401);
  
  const { message, signature } = await c.req.json();

  const { address, nonce } = parseSiweMessage(message);
  if (!nonce) throw new ApiError("invalid nonce", 401);
  if (!address) throw new ApiError("no address found in message", 401);

  const success = await publicClient.verifySiweMessage({
    message,
    signature,
    nonce,
    address,
  });
  
  if (!success) throw new ApiError("invalid signature", 401);

  const ensName = await publicClient.getEnsName({ address })

  await db.update(schema.sessions).set({
    address,
    ensName,
    nonce,
    signature,
  }).where(eq(schema.sessions.id, id));

  const data: Me = {
    address,
    ensName,
  }

  return resf(c, data);
});

app.get("/me", async (c) => {
  const id = getCookie(c, cookieName);
  if (!id) throw new ApiError("no id found in cookie", 401);

  const [session] = await db.select().from(schema.sessions).where(eq(schema.sessions.id, id));
  if (!session) throw new ApiError("session not found", 401);
  if (!session.address) throw new ApiError("address not found", 401);

  const data: Me = {
    address: session.address,
    ensName: session.ensName,
  }

  return resf(c, data);
});

app.post("/logout", async (c) => {
  const id = getCookie(c, cookieName);
  if (!id) throw new ApiError("no id found in cookie", 401);

  await db.delete(schema.sessions).where(eq(schema.sessions.id, id));
  deleteCookie(c, cookieName);
  const data: Logout = "ok";
  return resf(c, data);
});

export default app;
