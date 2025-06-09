import { Context, Next } from 'hono';
import { Hex } from 'viem';

declare module 'hono' {
  interface ContextVariableMap {
    txs: Hex[];
  }
}

export const txCheck = async (c: Context, next: Next) => {
  const { txs } = c.req.param();

  c.set('txs', txs?.split(',').map(tx => tx.trim() as Hex) || []);
  await next();
};
