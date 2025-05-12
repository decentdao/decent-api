import WebSocket from 'ws';
import { describe, it, expect, afterAll } from 'bun:test';
import app from '@/api/index';
import { daoChainId, daoAddress } from 'test/constants';
import { Topics } from '@/api/ws/topics';
import {
  ConnectionResponseType,
  SubscriptionRequestType,
  SubscriptionResponseType,
  WsMessage,
} from '@/api/ws/connections';

const port = 2000;
Bun.serve({
  port,
  fetch: app.fetch,
  websocket: app.websocket,
});

let _ws: WebSocket | null = null;

describe('WebSocket Integration', () => {
  const url = `ws://localhost:${port}/ws`;

  const message = 'message';

  it('Connect to Websocket', async () => {
    const ws = new WebSocket(url);
    const connectedResponse = JSON.parse(
      await new Promise(resolve => {
        ws.addEventListener(message, ({ data }) => resolve(data.toString('utf8')), {
          once: true,
        });
      }),
    ) as WsMessage;
    expect(connectedResponse.msg).toBe(ConnectionResponseType.Connected);

    it('Subscribe and Unsubscribe', async () => {
      const topic = Topics.dao(daoChainId, daoAddress);
      const subscribeMessage = JSON.stringify({
        msg: SubscriptionRequestType.Subscribe,
        topic: topic,
      });

      // First subscribe to a topic
      let subscribedResponse = JSON.parse(
        await new Promise(resolve => {
          ws.addEventListener(message, ({ data }) => resolve(data.toString('utf8')), {
            once: true,
          });

          // Send a client message to the server
          ws.send(subscribeMessage);
        }),
      ) as WsMessage;

      console.log(subscribedResponse);

      // Perform assertions on the response message that the client receives
      expect(subscribedResponse.msg).toBe(SubscriptionResponseType.Subscribed);
      expect(subscribedResponse.topic).toBe(topic);
      expect(subscribedResponse.data).toBeDefined();
      expect(subscribedResponse.warning).toBeUndefined();

      // Second subscribe to a topic
      subscribedResponse = JSON.parse(
        await new Promise(resolve => {
          ws.addEventListener(message, ({ data }) => resolve(data.toString('utf8')), {
            once: true,
          });

          // Send a client message to the server
          ws.send(subscribeMessage);
        }),
      ) as WsMessage;

      console.log(subscribedResponse);

      // Perform assertions on the response message that the client receives
      expect(subscribedResponse.msg).toBe(SubscriptionResponseType.Subscribed);
      expect(subscribedResponse.topic).toBe(topic);
      expect(subscribedResponse.data).toBeDefined();
      expect(subscribedResponse.warning).toBe('Previously subscribed');

      const unsubscribeMessage = JSON.stringify({
        msg: SubscriptionRequestType.Unsubscribe,
        topic: topic,
      });

      let unsubscribedResponse = JSON.parse(
        await new Promise(resolve => {
          ws.addEventListener(message, ({ data }) => resolve(data.toString('utf8')), {
            once: true,
          });

          // Send a client message to the server
          ws.send(unsubscribeMessage);
        }),
      ) as WsMessage;

      console.log(unsubscribedResponse);

      // Perform assertions on the response message that the client receives
      expect(unsubscribedResponse.msg).toBe(SubscriptionResponseType.Unsubscribed);
      expect(unsubscribedResponse.topic).toBe(topic);
      expect(unsubscribedResponse.warning).toBeUndefined();

      // Second unsubscribe from a topic
      unsubscribedResponse = JSON.parse(
        await new Promise(resolve => {
          ws.addEventListener(message, ({ data }) => resolve(data.toString('utf8')), {
            once: true,
          });

          // Send a client message to the server
          ws.send(unsubscribeMessage);
        }),
      ) as WsMessage;

      console.log(unsubscribedResponse);

      // Perform assertions on the response message that the client receives
      expect(unsubscribedResponse.msg).toBe(SubscriptionResponseType.Unsubscribed);
      expect(unsubscribedResponse.topic).toBe(topic);
      expect(unsubscribedResponse.warning).toBe('Previously unsubscribed');
    });
  });
});

afterAll(() => {
  if (_ws) {
    _ws.close();
    _ws = null;
  }
});
