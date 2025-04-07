import { describe, it, expect } from 'bun:test';
import app from '@/api/index';
import { ApiResponse, Nonce, User } from '@/api/types';
import {
  cookies,
  getCookie,
  setSessionId,
  signedSiweMessage,
  testAccount,
} from '../client.test';

describe('Auth API', () => {
  let nonce: string;

  it('should return a nonce', async () => {
    const res = await app.request('/auth/nonce');
    expect(res.status).toBe(200);
    const { data } = await res.json() as ApiResponse<Nonce>;
    expect(data?.nonce).toBeDefined();
    const sessionId = getCookie(res);
    console.log('got sessionId', sessionId);
    setSessionId(sessionId);
    nonce = data?.nonce || '';
  });

  it('verify siwe message', async () => {
    const signedMessage = await signedSiweMessage(nonce);
    const res = await app.request('/auth/verify', {
      method: 'POST',
      headers: cookies(),
      body: JSON.stringify({
        message: signedMessage.message,
        signature: signedMessage.signature,
      }),
    });
    const json = await res.json() as ApiResponse<User>;
    expect(json.success).toBeTrue();
    expect(json.error).toBeFalsy();
    expect(json.data?.address).toBe(testAccount.address);
    expect(json.data?.ensName).toBeDefined();
  });

  it('should return a user', async () => {
    const res = await app.request('/auth/me', {
      headers: cookies(),
    });
    expect(res.status).toBe(200);
    const { data } = await res.json() as ApiResponse<User>;
    expect(data?.address).toBe(testAccount.address);
    expect(data?.ensName).toBeDefined();
  });
});
