import { Hono } from 'hono';
import { createBunWebSocket } from 'hono/bun';

export class Socket {
  public static setup(app: Hono) {
    /*
      TODO: ENG-748 Websocket - Figure out if we can serve websocket on the same port as Http/Https
      */
    const { upgradeWebSocket, websocket } = createBunWebSocket();
    Bun.serve({
      fetch: app.fetch,
      port: 81,
      websocket,
    });
    app.get(
      '/ws',
      upgradeWebSocket(() => {
        return {
          onMessage(event, ws) {
            console.log(`Message from client: ${event.data}`);
            ws.send('Hello from server!');
          },
          onClose: () => {
            console.log('Connection closed');
          },
        };
      }),
    );
  }
}
