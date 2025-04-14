import { describe, it, expect } from 'bun:test';
import app from '@/api/index';
import { cookies, clientStore } from 'test/client';
import { daoChainId, daoAddress, newComment } from 'test/constants';

describe('Comments API', () => {
  it('POST comment without a cookie', async () => {
    const res = await app.request(`/d/${daoChainId}/${daoAddress}/proposals/${clientStore.proposalSlug}/comments`, {
      method: 'POST',
      body: JSON.stringify(newComment),
    });

    expect(res.status).toBe(401);
  });

  it('POST comment with wallet 2', async () => {
    const res = await app.request(`/d/${daoChainId}/${daoAddress}/proposals/${clientStore.proposalSlug}/comments`, {
      method: 'POST',
      headers: cookies(2),
      body: JSON.stringify(newComment),
    });

    expect(res.status).toBe(200);
  });
});
