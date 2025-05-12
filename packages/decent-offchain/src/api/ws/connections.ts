import { WSContext } from 'hono/ws';
import { DecentData, payload } from './payload';
import { ServerWebSocket } from 'bun';
import { nanoid } from 'nanoid';

export type WsMessage = {
  msg:
    | ConnectionResponseType
    | SubscriptionResponseType
    | SubscriptionRequestType
    | DisconnectRequestType
    | 'error';
  warning?: string;
  topic?: string;
  data?: DecentData;
};

/* eslint-disable no-unused-vars */
/* linter gives false positive on this */
export enum ConnectionResponseType {
  Connected = 'connected',
}

export enum SubscriptionResponseType {
  Subscribed = 'subscribed',
  Unsubscribed = 'unsubscribed',
  Updated = 'updated',
}

export enum SubscriptionRequestType {
  Subscribe = 'subscribe',
  Unsubscribe = 'unsubscribe',
}

export enum DisconnectRequestType {
  Disconnect = 'disconnect',
}

interface WithId {
  id?: string;
}

export const WebSocketConnections = {
  sockets: new Map<string, WSContext<unknown>>(),
  topics: new Map<string, Set<string>>(),

  connected(ws: WSContext<unknown>) {
    const serverSocket = ws.raw as ServerWebSocket<unknown>;
    const id = nanoid();
    const data = serverSocket.data ?? {};
    serverSocket.data = { ...data, id };
    this.sockets.set(id, ws);

    // Send a connected message immediately upon connection
    const msg: WsMessage = {
      msg: ConnectionResponseType.Connected,
    };
    this._sendRaw(ws, msg);
  },

  disconnected(ws: WSContext<unknown>) {
    const serverSocket = ws.raw as ServerWebSocket<unknown>;
    const id = (serverSocket.data as WithId)?.id;
    if (id) {
      this.sockets.delete(id);

      // Clean up subscriptions
      for (const [topic, subscriptions] of this.topics.entries()) {
        subscriptions.delete(id);
        if (subscriptions.size === 0) {
          this.topics.delete(topic);
        }
      }
    }
  },

  received(ws: WSContext<unknown>, message: string | ArrayBuffer) {
    const decoded = this._decodeMessage(ws, message);
    if (!decoded) {
      return;
    }
    const { id, msg, topic } = decoded;
    try {
      switch (msg) {
        case SubscriptionRequestType.Subscribe:
          {
            const subscriptions = this.topics.get(topic) || new Set<string>();
            const alreadySubscribed = subscriptions.has(id);
            subscriptions.add(id);
            this.topics.set(topic, subscriptions);

            /* Initial payload is sent immediately upon subscription, not through publish */
            payload(topic)
              .then(async data => {
                this._send(
                  ws,
                  SubscriptionResponseType.Subscribed,
                  topic,
                  data,
                  alreadySubscribed ? 'Previously subscribed' : undefined,
                );
              })
              .catch(error => {
                this._error(ws, error instanceof Error ? error.message : String(error));
                return;
              });
          }
          break;

        case SubscriptionRequestType.Unsubscribe:
          {
            const subscriptions = this.topics.get(topic) || new Set<string>();
            const alreadyUnsubscribed = !subscriptions.has(id);
            subscriptions.delete(id);
            this.topics.set(topic, subscriptions);

            this._send(
              ws,
              SubscriptionResponseType.Unsubscribed,
              topic,
              undefined,
              alreadyUnsubscribed ? 'Previously unsubscribed' : undefined,
            );
          }
          break;

        case DisconnectRequestType.Disconnect:
          {
            ws.close(1000, 'Client requested disconnection');
            this.disconnected(ws);
          }
          break;
      }
    } catch (error) {
      this._error(ws, error instanceof Error ? error.message : String(error));
      return;
    }
  },

  publish(topic: string, data: DecentData) {
    const subscriptions = this.topics.get(topic);
    if (!subscriptions || subscriptions.size === 0) {
      return;
    }
    for (const id of subscriptions) {
      const ws = this.sockets.get(id);
      if (!ws) {
        continue;
      }
      this._send(ws, SubscriptionResponseType.Updated, topic, data);
    }
  },

  _decodeMessage(
    ws: WSContext<unknown>,
    message: string | ArrayBuffer,
  ): { id: string; msg: string; topic: string } | undefined {
    let parsedMessage: WsMessage;
    if (typeof message === 'string') {
      parsedMessage = JSON.parse(message);
    } else {
      parsedMessage = JSON.parse(new TextDecoder().decode(message));
    }
    if (!parsedMessage || typeof parsedMessage !== 'object' || !('msg' in parsedMessage)) {
      this._error(ws, `Invalid message format: ${message}`);
      return undefined;
    }
    const topic = parsedMessage.topic;
    if (!topic || typeof topic !== 'string') {
      this._error(ws, `Invalid topic: ${topic}`);
      return undefined;
    }
    const id = ((ws.raw as ServerWebSocket<unknown>).data as WithId)?.id;
    if (!id || !this.sockets.has(id)) {
      this._error(ws, `WebSocket connection not found: ${id}`);
      return undefined;
    }
    return { id, msg: parsedMessage.msg, topic };
  },

  _sendRaw(ws: WSContext<unknown>, message: WsMessage) {
    ws.send(JSON.stringify(message));
  },

  _error(ws: WSContext<unknown>, errorMessage: string) {
    const errorMessageObj: WsMessage = {
      msg: 'error',
      data: errorMessage,
    };
    this._sendRaw(ws, errorMessageObj);
  },

  _send(
    ws: WSContext<unknown>,
    type: SubscriptionResponseType,
    topic: string,
    data?: DecentData,
    warning?: string,
  ) {
    const message: WsMessage = {
      msg: type,
      warning,
      topic,
      data,
    };
    this._sendRaw(ws, message);
  },
};
