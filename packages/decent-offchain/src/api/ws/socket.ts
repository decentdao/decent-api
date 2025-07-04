import { Hono } from 'hono';
import { createBunWebSocket } from 'hono/bun';
import { WebSocketConnections } from './connections';

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
        WebSocketConnections.disconnected(ws);
      },
      onError(event, ws) {
        console.error('WebSocket error:', event);
        console.log('Error on connection:', ws);
        ws.close(500, 'Internal Server Error');
        WebSocketConnections.disconnected(ws);
      },
    };
  }),
);

export default app;
