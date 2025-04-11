import { describe, it, expect } from 'bun:test';
import app from '@/api/index';
import { NewProposal, Proposal, ApiResponse, Logout } from 'decent-types';
import { cookies } from '../client.test'

const daoAddress = '0x07a281d9CF79585282a2ADa24B78B494977DC33E';
const daoChainId = 8453;
const body: NewProposal = {
  title: 'Test Proposal',
  body: 'Test Description',
  voteType: 'single-choice'
};

let newProposalSlug: string | undefined;

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
      headers: cookies(1),
      body: JSON.stringify(body),
    });
    const json = await res.json() as ApiResponse<Proposal>;
    console.log(json);
    newProposalSlug = json?.data?.slug;
    expect(res.status).toBe(200);
  });

  it('PUT proposal with a valid cookie', async () => {
    body.title = 'Updated Proposal';
    const res = await app.request(`/d/${daoChainId}/${daoAddress}/proposals/${newProposalSlug}`, {
      method: 'PUT',
      headers: cookies(1),
      body: JSON.stringify(body),
    });
    const json = await res.json() as ApiResponse<Proposal>;
    expect(res.status).toBe(200);
    expect(json.data?.title).toBe(body.title);
  });

  it('PUT proposal from another wallet with proposer permissions', async () => {
    const res = await app.request(`/d/${daoChainId}/${daoAddress}/proposals/${newProposalSlug}`, {
      method: 'PUT',
      headers: cookies(2),
      body: JSON.stringify(body),
    });
    const json = await res.json() as ApiResponse<Proposal>;
    expect(json.error).toBeDefined();
    expect(json?.error?.message).toBe('Proposal not found or you are not the author');
    expect(res.status).toBe(403);
  });

  it('PUT proposal from another wallet without proposer permissions', async () => {
    const res = await app.request(`/d/${daoChainId}/${daoAddress}/proposals/${newProposalSlug}`, {
      method: 'PUT',
      headers: cookies(3),
      body: JSON.stringify(body),
    });
    const json = await res.json() as ApiResponse<Proposal>;
    expect(json.error).toBeDefined();
    expect(json?.error?.message).toBe('User does not have proposer permissions');
    expect(res.status).toBe(403);
  });
});

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
