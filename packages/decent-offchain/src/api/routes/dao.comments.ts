import { Hono } from 'hono';
import { db } from '@/db';
import resf from '@/api/utils/responseFormatter';

const app = new Hono();

app.get('/', async (c) => {
  const comments = await db.query.comments.findMany();

  return resf(c, comments);
});

export default app;
