import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { generateSiweNonce, parseSiweMessage } from 'viem/siwe';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { User, Nonce, Logout } from 'decent-types';
import { schema } from '@/db/schema';
import { db } from '@/db';
import resf, { ApiError } from '@/api/utils/responseFormatter';
import { publicClient } from '@/api/utils/publicClient';
import { cookieName, cookieOptions } from '@/api/utils/cookie';

const app = new Hono();

/**
 * @title Get a nonce for SIWE authentication
 * @route GET /auth/nonce
 * @returns {Nonce} Nonce object
 */
app.get('/nonce', async (c) => {
  const id = getCookie(c, cookieName) || nanoid();
  const [session] = await db.select()
    .from(schema.sessionTable)
    .where(eq(schema.sessionTable.id, id));

  const nonce = session?.nonce || generateSiweNonce();

  if (!session?.nonce) {
    await db.insert(schema.sessionTable).values({
      id,
      nonce,
    });
    setCookie(c, cookieName, id, cookieOptions);
  }

  const data: Nonce = { nonce };

  return resf(c, data);
});

/**
 * @title Verify a SIWE message and signature
 * @route POST /auth/verify
 * @body { message: string, signature: string }
 * @returns {User} Me object
 */
app.post('/verify', async (c) => {
  const id = getCookie(c, cookieName);
  if (!id) throw new ApiError('cookie not found', 401);

  const [session] = await db.select().from(schema.sessionTable).where(eq(schema.sessionTable.id, id));
  if (!session) throw new ApiError('session not found', 401);

  const { message, signature } = await c.req.json();

  const { address, nonce } = parseSiweMessage(message);
  if (!nonce) throw new ApiError('invalid nonce', 401);
  if (!address) throw new ApiError('no address found in message', 401);

  const success = await publicClient.verifySiweMessage({
    message,
    signature,
    nonce,
    address,
  });

  if (!success) throw new ApiError('invalid signature', 401);

  const ensName = await publicClient.getEnsName({ address })

  await db.update(schema.sessionTable).set({
    address,
    ensName,
    nonce,
    signature,
  }).where(eq(schema.sessionTable.id, id));

  const data: User = {
    address,
    ensName,
  }

  return resf(c, data);
});

/**
 * @title Get the current authenticated user's information
 * @route GET /auth/me
 * @returns {User} Me object
 */
app.get('/me', async (c) => {
  const id = getCookie(c, cookieName);
  if (!id) throw new ApiError('cookie not found', 401);

  const [session] = await db.select().from(schema.sessionTable).where(eq(schema.sessionTable.id, id));
  if (!session) throw new ApiError('session not found', 401);
  if (!session.address) throw new ApiError('address not found', 401);

  const data: User = {
    address: session.address,
    ensName: session.ensName,
  }

  return resf(c, data);
});

/**
 * @title Log out the current user
 * @route POST /auth/logout
 * @returns {Logout} Logout object
 */
app.post('/logout', async (c) => {
  const id = getCookie(c, cookieName);
  if (!id) throw new ApiError('cookie not found', 401);

  await db.delete(schema.sessionTable).where(eq(schema.sessionTable.id, id));
  deleteCookie(c, cookieName);
  const data: Logout = 'ok';
  return resf(c, data);
});

export default app;
