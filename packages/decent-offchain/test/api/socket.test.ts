import WebSocket from 'ws';
import { describe, it, expect } from 'bun:test';
import app from '@/api/index';

const port = 2000;
Bun.serve({
  port,
  fetch: app.fetch,
  websocket: app.websocket,
});

describe('WebSocket Integration', () => {
  const url = `ws://localhost:${port}/ws`;

  it('Connect to Websocket', async () => {
    const ws = new WebSocket(url);
    const connectedMsg = await new Promise(resolve => {
      ws.addEventListener('message', ({ data }) => resolve(data.toString('utf8')), {
        once: true,
      });
    });
    expect(connectedMsg).toBe('{"msg":"connected"}');

    const subscribeMessage = '{"msg":"subscribe","topic":"topic1"}';

    const subscribedResponse = await new Promise(resolve => {
      ws.addEventListener('message', ({ data }) => resolve(data.toString('utf8')), {
        once: true,
      });

      // 2) Send a client message to the server
      ws.send(subscribeMessage);
    });

    // 3) Perform assertions on the response message that the client receives
    expect(subscribedResponse).toBe(subscribeMessage.replace('subscribe', 'subscribed'));

    // 4) Close the client when everything is done
    ws.close();
  });
});
