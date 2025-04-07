import { describe, it, expect } from 'bun:test';
import { ApiResponse, Logout } from '@/api/types';
import { cookies } from 'test/client.test';
import app from '@/api';

describe('Logout', () => {
  it('should logout a user', async () => {
    const res = await app.request('/auth/logout', {
      method: 'POST',
      headers: cookies(),
    });
    const json = await res.json() as ApiResponse<Logout>;
    expect(res.status).toBe(200);
    expect(json.data).toBe('ok');
  });
});
