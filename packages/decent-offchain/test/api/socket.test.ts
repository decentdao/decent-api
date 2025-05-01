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

    it('Subscribe and Unsubscribe', async () => {
      const subscribeMessage =
        '{"msg":"subscribe","topic":"dao:1:0xB98d45F9021D71E6Fc30b43FD37FB3b1Bf12c064"}';

      // First subscribe to a topic
      let subscribedResponse = await new Promise(resolve => {
        ws.addEventListener('message', ({ data }) => resolve(data.toString('utf8')), {
          once: true,
        });

        // Send a client message to the server
        ws.send(subscribeMessage);
      });

      expect(subscribedResponse).toBeString();
      {
        const msg = JSON.parse(subscribedResponse as string);

        // Perform assertions on the response message that the client receives
        expect(msg.msg).toBe('subscribed');
        expect(msg.topic).toBe('dao:1:0xB98d45F9021D71E6Fc30b43FD37FB3b1Bf12c064');
        expect(msg.data).toBeDefined();
        expect(msg.notes).toBeUndefined();
      }

      // Second subscribe to a topic
      subscribedResponse = await new Promise(resolve => {
        ws.addEventListener('message', ({ data }) => resolve(data.toString('utf8')), {
          once: true,
        });

        // Send a client message to the server
        ws.send(subscribeMessage);
      });

      expect(subscribedResponse).toBeString();
      {
        const msg = JSON.parse(subscribedResponse as string);

        // Perform assertions on the response message that the client receives
        expect(msg.msg).toBe('subscribed');
        expect(msg.topic).toBe('dao:1:0xB98d45F9021D71E6Fc30b43FD37FB3b1Bf12c064');
        expect(msg.data).toBeDefined();
        expect(msg.notes).toBe('Previously subscribed');
      }

      // First unsubscribe from a topic
      const unsubscribeMessage =
        '{"msg":"unsubscribe","topic":"dao:1:0xB98d45F9021D71E6Fc30b43FD37FB3b1Bf12c064"}';

      let unsubscribedResponse = await new Promise(resolve => {
        ws.addEventListener('message', ({ data }) => resolve(data.toString('utf8')), {
          once: true,
        });

        // Send a client message to the server
        ws.send(unsubscribeMessage);
      });

      expect(unsubscribedResponse).toBeString();
      {
        const msg = JSON.parse(unsubscribedResponse as string);

        // Perform assertions on the response message that the client receives
        expect(msg.msg).toBe('unsubscribed');
        expect(msg.topic).toBe('dao:1:0xB98d45F9021D71E6Fc30b43FD37FB3b1Bf12c064');
        expect(msg.notes).toBeUndefined();
      }

      // Second unsubscribe from a topic
      unsubscribedResponse = await new Promise(resolve => {
        ws.addEventListener('message', ({ data }) => resolve(data.toString('utf8')), {
          once: true,
        });

        // Send a client message to the server
        ws.send(unsubscribeMessage);
      });

      expect(unsubscribedResponse).toBeString();
      {
        const msg = JSON.parse(unsubscribedResponse as string);

        // Perform assertions on the response message that the client receives
        expect(msg.msg).toBe('unsubscribed');
        expect(msg.topic).toBe('dao:1:0xB98d45F9021D71E6Fc30b43FD37FB3b1Bf12c064');
        expect(msg.notes).toBe('Previously unsubscribed');
      }
    });
    // Close the client when everything is done
    ws.close();
  });
});
