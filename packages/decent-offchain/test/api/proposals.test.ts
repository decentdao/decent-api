import { describe, it, expect } from 'bun:test';
import app from '@/api/index';
import { NewProposal, Proposal } from '@/api/types/Proposal';
import {
  cookies,
  setSessionId
} from '../client.test'
import { ApiResponse, Logout } from '@/api/types';

const daoAddress = '0x07a281d9CF79585282a2ADa24B78B494977DC33E';
const daoChainId = 8453;
const body: NewProposal = {
  title: 'Test Proposal',
  body: 'Test Description',
  voteType: 'single-choice'
};

describe('Proposals API', () => {
  it('POST proposal without a cookie', async () => {
    const res = await app.request(`/d/${daoChainId}/${daoAddress}/proposals`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    expect(res.status).toBe(401);
  });

  it('POST proposal with a valid cookie', async () => {
    const res = await app.request(`/d/${daoChainId}/${daoAddress}/proposals`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: cookies()
    });
    const json = await res.json() as ApiResponse<Proposal>;
    console.log(json);
    expect(res.status).toBe(403);
  });

  it('POST proposal with a blank cookie', async () => {
    setSessionId('blank');
    const res = await app.request(`/d/${daoChainId}/${daoAddress}/proposals`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: cookies()
    });
    expect(res.status).toBe(401);
  });
});

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
