import { Hono } from 'hono';
import { createBunWebSocket } from 'hono/bun';
import { WebSocketConnections } from './connections';
import { ServerWebSocket } from 'bun';

const app = new Hono();

const { upgradeWebSocket } = createBunWebSocket();

app.get(
  '/',
  upgradeWebSocket(() => {
    return {
      onOpen(_event, ws) {
        console.log('New connection established');
        WebSocketConnections.connected(ws);
      },
      onMessage(_event, ws) {
        console.log(`Message from client: ${_event.data}`);
        WebSocketConnections.received(ws, _event.data);
      },
      onClose(event, ws) {
        console.log(event, ws);
        console.log('Connection closed');
      },
      onError(event, ws) {
        console.error('WebSocket error:', event);
        console.log('Error on connection:', ws);
        ws.close(500, 'Internal Server Error');
      },
    };
  }),
);

export default app;
