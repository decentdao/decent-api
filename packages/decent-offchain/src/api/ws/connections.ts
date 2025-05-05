import { WSContext } from 'hono/ws';
import { Dispatch } from './dispatch';
import { ServerWebSocket } from 'bun';
import { nanoid } from 'nanoid';

export type WsMessage = {
  msg: string;
  notes?: string;
  topic?: string;
  data?: unknown;
};

export enum ConnectionResponseType {
  Connected = 'connected',
  Disconnected = 'disconnected',
}

export enum SubscriptionResponseType {
  Subscribed = 'subscribed',
  Unsubscribed = 'unsubscribed',
  Updated = 'updated',
  Deleted = 'deleted',
}

export enum SubscriptionRequestType {
  Subscribe = 'subscribe',
  Unsubscribe = 'unsubscribe',
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

    // Send a connected message immediately upon connection
    const msg: WsMessage = {
      msg: ConnectionResponseType.Connected,
    };
    this._sendRaw(ws, msg);
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
            Dispatch.topic(ws, topic)
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
      }
    } catch (error) {
      this._error(ws, error instanceof Error ? error.message : String(error));
      return;
    }
  },

  updated(topic: string, data: unknown) {
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

  deleted(topic: string, data: unknown) {
    const subscriptions = this.topics.get(topic);
    if (!subscriptions || subscriptions.size === 0) {
      return;
    }
    for (const id of subscriptions) {
      const ws = this.sockets.get(id);
      if (!ws) {
        continue;
      }
      this._send(ws, SubscriptionResponseType.Deleted, topic, data);
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
    data?: unknown,
    notes?: string,
  ) {
    const message: WsMessage = {
      msg: type,
      notes,
      topic,
      data,
    };
    this._sendRaw(ws, message);
  },
};
