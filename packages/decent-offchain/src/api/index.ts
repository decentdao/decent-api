import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createBunWebSocket } from 'hono/bun';
import resf from '@/api/utils/responseFormatter';

// Route imports
import meta from '@/api/routes/meta';
import socket from '@/api/ws/socket';
import docs from '@/api/routes/docs';
import auth from '@/api/routes/auth';
import dao from '@/api/routes/dao';
import proposals from '@/api/routes/dao.proposals';
import comments from '@/api/routes/dao.comments';
import points from '@/api/routes/points';
import wallet from '@/api/routes/wallet';

const app = new Hono();
const { websocket } = createBunWebSocket();

const port = process.env.PORT || 3005;

app.use(
  '*',
  cors({
    origin: origin => {
      const allowedOrigins = [
        'http://localhost:3000',
        'https://app.decentdao.org',
        'https://galxe.com',
        'https://app.galxe.com',
        'https://dashboard.galxe.com',
      ];
      if (allowedOrigins.includes(origin)) {
        return origin;
      }
      if (origin.endsWith('.decent-interface.pages.dev')) {
        return origin;
      }
      return null;
    },
    credentials: true,
  }),
);

app.onError((err, c) => {
  return resf(c, err, 500);
});

// Routes
app.route('/', meta);
app.route('/ws', socket);
app.route('/docs', docs);
app.route('/auth', auth);
app.route('/points', points);
app.route('/wallet', wallet);
app.route('/d', dao);
app.route('/d/:chainId/:address/proposals', proposals);
app.route('/d/:chainId/:address/proposals/:slug/comments', comments);

export default {
  ...app,
  port,
  websocket,
};
