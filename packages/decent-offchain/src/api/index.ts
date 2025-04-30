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
import { Socket } from '@/ws/socket';

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

Socket.setup(app);

export default app;
