import { Hono } from 'hono';
import { cors } from 'hono/cors';
import resf from '@/api/utils/responseFormatter';

// Route imports
import meta from '@/api/routes/meta';
import docs from '@/api/routes/docs';
import auth from '@/api/routes/auth';
import dao from '@/api/routes/dao';
import proposals from '@/api/routes/dao.proposals';
import comments from '@/api/routes/dao.comments';
import { createBunWebSocket } from 'hono/bun';

const app = new Hono();

app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'https://decentdao.org'],
    credentials: true,
  }),
);

app.onError((err, c) => {
  return resf(c, err, 500);
});

// Routes
app.route('/', meta);
app.route('/docs', docs);
app.route('/auth', auth);
app.route('/d', dao);
app.route('/d/:chainId/:address/proposals', proposals);
app.route('/d/:chainId/:address/proposals/:slug/comments', comments);

/*
  TODO: ENG-748 Websocket - Figure out if we can serve websocket on the same port as Http/Https
  */
const { upgradeWebSocket, websocket } = createBunWebSocket();
Bun.serve({
  fetch: app.fetch,
  port: 81,
  websocket,
});
app.get(
  '/ws',
  upgradeWebSocket(() => {
    return {
      onMessage(event, ws) {
        console.log(`Message from client: ${event.data}`);
        ws.send('Hello from server!');
      },
      onClose: () => {
        console.log('Connection closed');
      },
    };
  }),
);

export default app;
