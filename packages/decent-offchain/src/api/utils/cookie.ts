export const cookieName = 'decent-session';

export const cookieOptions = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'none',
  domain: process.env.NODE_ENV === 'production' ? 'decentdao.org' : 'localhost',
} as const;
