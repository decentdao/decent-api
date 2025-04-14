import { describe, expect, it } from 'bun:test';
import { ApiResponse, Logout } from 'decent-types';
import app from '@/api/index';
import { cookies } from 'test/client';

describe('Logout', () => {
  it('should logout a user', async () => {
    const res = await app.request('/auth/logout', {
      method: 'POST',
      headers: cookies(1),
    });
    const json = await res.json() as ApiResponse<Logout>;
    expect(res.status).toBe(200);
    expect(json.data).toBe('ok');
  });
});
