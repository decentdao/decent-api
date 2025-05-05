export const cookieName = 'decent-session';

export const cookieOptions = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  domain: process.env.NODE_ENV === 'production' ? 'decent-offchain.up.railway.app' : 'localhost',
} as const;
