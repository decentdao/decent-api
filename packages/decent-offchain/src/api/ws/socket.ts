import { Hono } from 'hono';
import { createBunWebSocket } from 'hono/bun';

const app = new Hono();

const { upgradeWebSocket } = createBunWebSocket();

app.get(
  '/',
  upgradeWebSocket(() => {
    return {
      onOpen(_event, ws) {
        console.log('Connection opened');
        ws.send('Hello from server!');
      },
      onMessage(_event, ws) {
        console.log(`Message from client: ${_event.data}`);
        ws.send('Hello from server!');
      },
      onClose(event, ws) {
        console.log(event, ws);
        console.log('Connection closed');
      },
    };
  }),
);

export default app;
