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
    const res = await app.request('/d');
    console.log(res.status);
    const ws = new WebSocket(url);
    const connectedMsg = await new Promise(resolve => {
      ws.addEventListener('message', ({ data }) => resolve(data.toString('utf8')), {
        once: true,
      });
    });
    expect(connectedMsg).toBe('{"msg":"connected"}');

    const subscribeMessage =
      '{"msg":"subscribe","topic":"dao:1:0xB98d45F9021D71E6Fc30b43FD37FB3b1Bf12c064"}';

    const subscribedResponse = await new Promise(resolve => {
      ws.addEventListener('message', ({ data }) => resolve(data.toString('utf8')), {
        once: true,
      });

      // 2) Send a client message to the server
      ws.send(subscribeMessage);
    });

    expect(subscribedResponse).toBeString();
    const msg = JSON.parse(subscribedResponse as string);

    // 3) Perform assertions on the response message that the client receives
    expect(msg.msg).toBe('subscribed');
    expect(msg.topic).toBe('dao:1:0xB98d45F9021D71E6Fc30b43FD37FB3b1Bf12c064');
    expect(msg.data).toBeDefined();

    // 4) Close the client when everything is done
    ws.close();
  });
});
