import { ServerWebSocket } from 'bun';
import { WSContext } from 'hono/ws';

export type WsMessage = {
  msg: string;
  topic?: string;
  data?: unknown;
};

/* eslint-disable no-unused-vars */
/* linter gives false positive on this */
export enum ConnectionResponseType {
  Connected = 'connected',
  Disconnected = 'disconnected',
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

export class WebSocketConnections {
  public static singleton?: WebSocketConnections;
  public static get(server: ServerWebSocket): WebSocketConnections {
    if (!WebSocketConnections.singleton) {
      WebSocketConnections.singleton = new WebSocketConnections(server);
    }
    return WebSocketConnections.singleton!;
  }

  server: ServerWebSocket;

  constructor(server: ServerWebSocket) {
    this.server = server;
  }

  public connected(ws: WSContext<unknown>) {
    // Send a connected message immediately upon connection
    const msg: WsMessage = {
      msg: ConnectionResponseType.Connected,
    };
    this._sendRaw(ws, msg);
  }

  private _sendRaw(ws: WSContext<unknown>, message: WsMessage) {
    ws.send(JSON.stringify(message));
  }

  private _error(ws: WSContext<unknown>, errorMessage: string) {
    const errorMessageObj: WsMessage = {
      msg: 'error',
      data: errorMessage,
    };
    this._sendRaw(ws, errorMessageObj);
  }

  public received(ws: WSContext<unknown>, message: string | ArrayBuffer) {
    let parsedMessage: WsMessage;
    try {
      if (typeof message === 'string') {
        parsedMessage = JSON.parse(message);
      } else {
        parsedMessage = JSON.parse(new TextDecoder().decode(message));
      }
      if (!parsedMessage || typeof parsedMessage !== 'object' || !('msg' in parsedMessage)) {
        this._error(ws, `Invalid message format: ${message}`);
        return;
      }
      switch (parsedMessage.msg) {
        case SubscriptionRequestType.Subscribe:
          {
            const topic = parsedMessage.topic;
            if (!topic || typeof topic !== 'string') {
              this._error(ws, `Invalid topic: ${topic}`);
              return;
            }
            // TODO: Send data with subscribed message
            this.send(ws, SubscriptionResponseType.Subscribed, topic);
          }
          break;

        case SubscriptionRequestType.Unsubscribe:
          {
            const topic = parsedMessage.topic;
            if (!topic || typeof topic !== 'string') {
              this._error(ws, `Invalid topic: ${topic}`);
              return;
            }
            this.send(ws, SubscriptionResponseType.Unsubscribed, topic);
          }
          break;
      }
    } catch (error) {
      this._error(ws, error instanceof Error ? error.message : String(error));
      return;
    }
  }

  public send(
    ws: WSContext<unknown>,
    type: SubscriptionResponseType,
    topic: string,
    data?: unknown,
  ) {
    const message: WsMessage = {
      msg: type,
      topic,
      data,
    };
    this._sendRaw(ws, message);
  }

  public update(topic: string, data: unknown) {
    const message: WsMessage = {
      msg: SubscriptionResponseType.Updated,
      topic,
      data,
    };
    this.server.publish(topic, JSON.stringify(message));
  }
}
