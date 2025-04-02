import { describe, it, expect } from 'bun:test';
import app from '@/api/index';
import { ApiResponse, Nonce, User, Logout } from "@/api/types";
import {
  cookies,
  getCookie,
  signedSiweMessage,
  testAccount,
} from "../client.test";

describe('Auth API', () => {
  let nonce: string;
  let sessionId: string;

  it('should return a nonce', async () => {
    const res = await app.request('/auth/nonce');
    expect(res.status).toBe(200);
    const { data } = await res.json() as ApiResponse<Nonce>;
    expect(data?.nonce).toBeDefined();
    sessionId = getCookie(res);
    nonce = data?.nonce || '';
  });

  it('verify siwe message', async () => {
    const signedMessage = await signedSiweMessage(nonce);
    const res = await app.request('/auth/verify', {
      method: 'POST',
      headers: cookies(sessionId),
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
      headers: cookies(sessionId),
    });
    expect(res.status).toBe(200);
    const { data } = await res.json() as ApiResponse<User>;
    expect(data?.address).toBe(testAccount.address);
    expect(data?.ensName).toBeDefined();
  });

  it('should logout a user', async () => {
    const res = await app.request('/auth/logout', {
      method: 'POST',
      headers: cookies(sessionId),
    });
    const json = await res.json() as ApiResponse<Logout>;
    expect(res.status).toBe(200);
    expect(json.data).toBe('ok');
  });
});
