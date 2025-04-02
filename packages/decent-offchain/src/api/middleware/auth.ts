import { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { db } from "@/db";
import { ApiError } from "@/api/utils/responseFormatter";
import { cookieName } from "@/api/utils/cookie";
import { User } from "@/api/types";

declare module "hono" {
  interface ContextVariableMap {
    user: User;
  }
}

export const siweAuth = async (c: Context, next: Next) => {
  const id = getCookie(c, cookieName);
  if (!id) throw new ApiError("no cookie found", 401);

  const session = await db.query.sessions.findFirst({
    where: (session, { eq }) => eq(session.id, id),
  });

  if (!session) throw new ApiError("session not found", 401);
  if (!session.address) throw new ApiError("address not found in session", 401);

  c.set("user", {
    address: session.address,
    ensName: session.ensName,
  });

  await next();
};
