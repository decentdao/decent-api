import { describe, it, expect } from 'bun:test';
import app from '@/api/index';
import { ApiResponse, Nonce, User } from 'decent-sdk';
import {
  cookies,
  getCookie,
  setSessionId,
  signedSiweMessage,
  WALLETS,
} from 'test/client';

describe('Auth API', () => {
  let nonce: string;

  it('should return a nonce', async () => {
    const res = await app.request('/auth/nonce');
    expect(res.status).toBe(200);
    const { data } = await res.json() as ApiResponse<Nonce>;
    expect(data?.nonce).toBeDefined();
    const sessionId = getCookie(res);
    setSessionId(1, sessionId);
    nonce = data?.nonce || '';
  });

  it('verify siwe message', async () => {
    const signedMessage = await signedSiweMessage(nonce, 1);
    const res = await app.request('/auth/verify', {
      method: 'POST',
      headers: cookies(1),
      body: JSON.stringify({
        message: signedMessage.message,
        signature: signedMessage.signature,
      }),
    });
    const json = await res.json() as ApiResponse<User>;
    expect(json.success).toBeTrue();
    expect(json.error).toBeFalsy();
    expect(json.data?.address).toBe(WALLETS[1].address);
    expect(json.data?.ensName).toBeDefined();
  });

  it('should return a user', async () => {
    const res = await app.request('/auth/me', {
      headers: cookies(1),
    });
    expect(res.status).toBe(200);
    const { data } = await res.json() as ApiResponse<User>;
    expect(data?.address).toBe(WALLETS[1].address);
    expect(data?.ensName).toBeDefined();
  });

  it('auth 2nd wallet', async () => {
    const nonceRes = await app.request('/auth/nonce');
    expect(nonceRes.status).toBe(200);
    const { data: nonceData } = await nonceRes.json() as ApiResponse<Nonce>;
    nonce = nonceData?.nonce || '';
    const sessionId = getCookie(nonceRes);
    setSessionId(2, sessionId);
    const signedMessage = await signedSiweMessage(nonce, 2);
    const verifyRes = await app.request('/auth/verify', {
      method: 'POST',
      headers: cookies(2),
      body: JSON.stringify({
        message: signedMessage.message,
        signature: signedMessage.signature,
      }),
    });
    expect(verifyRes.status).toBe(200);
    const { data: verifyData } = await verifyRes.json() as ApiResponse<User>;
    expect(verifyData?.address).toBe(WALLETS[2].address);
    expect(verifyData?.ensName).toBeDefined();
  });

  it('auth 3rd wallet', async () => {
    const nonceRes = await app.request('/auth/nonce');
    expect(nonceRes.status).toBe(200);
    const { data: nonceData } = await nonceRes.json() as ApiResponse<Nonce>;
    nonce = nonceData?.nonce || '';
    const sessionId = getCookie(nonceRes);
    setSessionId(3, sessionId);
    const signedMessage = await signedSiweMessage(nonce, 3);
    const verifyRes = await app.request('/auth/verify', {
      method: 'POST',
      headers: cookies(3),
      body: JSON.stringify({
        message: signedMessage.message,
        signature: signedMessage.signature,
      }),
    });
    expect(verifyRes.status).toBe(200);
  });
});
