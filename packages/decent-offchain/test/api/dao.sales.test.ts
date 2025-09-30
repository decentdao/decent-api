import { Address } from 'viem';
import { describe, it, expect } from 'bun:test';
import app from '@/api/index';
import { ApiResponse } from 'decent-sdk';
import { signVerificationData, WALLETS } from 'test/client';
import { VerificationResponse } from '@/lib/verifier/types';
import { TokenSaleRequirements } from '@/lib/requirements/types';

const daoChainId = 11155111;
const daoAddress = '0x7a5555721d6548f2fa54249a19d96b4bc33264ca';

describe('DAO Sales API', () => {
  // let tokenSaleAddress: Address | undefined;
  const tokenSaleAddress = '0xf02d8a2f4a0cbc3914611ec625b4b12e1c0448ec';
  // it('GET sales for DAO', async () => {
  //   const res = await app.request(`/d/${daoChainId}/${daoAddress}/sales`);
  //   expect(res.status).toBe(200);
  //   const { data } = (await res.json()) as ApiResponse<
  //     {
  //       tokenSaleAddress: Address;
  //       tokenSaleName: string;
  //       tokenSaleRequirements: TokenSaleRequirements;
  //     }[]
  //   >;
  //   expect(data).toBeDefined();
  //   expect(Array.isArray(data)).toBeTrue();
  //   // If there are sales, save the first one for verify tests
  //   if (data && data[1]) {
  //     tokenSaleAddress = data[1].tokenSaleAddress;
  //     console.dir(data[1], { depth: null });
  //   }
  // });

  it('POST verify with valid signature', async () => {
    // Skip if no token sales exist
    if (!tokenSaleAddress) {
      console.log('No token sales found, skipping verify test');
      return;
    }

    const { message, signature, address } = await signVerificationData(
      1,
      tokenSaleAddress,
      daoChainId,
    );

    const res = await app.request(
      `/d/${daoChainId}/${daoAddress}/sales/${tokenSaleAddress}/verify?kycType=url`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          message,
          signature,
        }),
      },
    );

    const json = (await res.json()) as ApiResponse<VerificationResponse>;
    console.log(json);
    expect(res.status).toBe(200);
    expect(json.success).toBeTruthy();
    expect(json.data).toBeDefined();
  });

  it('POST verify with invalid signature', async () => {
    // Skip if no token sales exist
    if (!tokenSaleAddress) {
      console.log('No token sales found, skipping verify test');
      return;
    }

    const { message } = await signVerificationData(1, tokenSaleAddress, daoChainId);
    const testAddress = WALLETS[1].address;
    const invalidSignature =
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b';

    const res = await app.request(
      `/d/${daoChainId}/${daoAddress}/sales/${tokenSaleAddress}/verify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: testAddress,
          message,
          signature: invalidSignature,
        }),
      },
    );

    expect(res.status).toBe(401);
    const json = (await res.json()) as ApiResponse<VerificationResponse>;
    expect(json.success).toBeFalsy();
    expect(json.error).toBeDefined();
  });

  it('POST verify with missing fields', async () => {
    // Skip if no token sales exist
    if (!tokenSaleAddress) {
      console.log('No token sales found, skipping verify test');
      return;
    }

    const res = await app.request(
      `/d/${daoChainId}/${daoAddress}/sales/${tokenSaleAddress}/verify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: WALLETS[1].address,
          // missing message and signature
        }),
      },
    );

    expect(res.status).toBe(400);
    const json = (await res.json()) as ApiResponse<VerificationResponse>;
    expect(json.success).toBeFalsy();
    expect(json.error).toBeDefined();
  });

  it('POST verify with invalid token sale address', async () => {
    const invalidTokenSaleAddress = '0x1234567890123456789012345678901234567890';

    // Create valid signature for the invalid token sale address
    const { message, signature, address } = await signVerificationData(
      1,
      invalidTokenSaleAddress,
      daoChainId,
    );

    const res = await app.request(
      `/d/${daoChainId}/${daoAddress}/sales/${invalidTokenSaleAddress}/verify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          message,
          signature,
        }),
      },
    );

    expect(res.status).toBe(404);
    const json = (await res.json()) as ApiResponse<VerificationResponse>;
    expect(json.success).toBeFalsy();
    expect(json.error).toBeDefined();
  });

  it('POST verify with mismatched address and signature', async () => {
    // Skip if no token sales exist
    if (!tokenSaleAddress) {
      console.log('No token sales found, skipping verify test');
      return;
    }

    // Sign with wallet index 1 but use address from wallet index 2
    const { message, signature } = await signVerificationData(1, tokenSaleAddress, daoChainId);
    const mismatchedAddress = WALLETS[2].address;

    const res = await app.request(
      `/d/${daoChainId}/${daoAddress}/sales/${tokenSaleAddress}/verify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: mismatchedAddress,
          message,
          signature,
        }),
      },
    );

    expect(res.status).toBe(401);
    const json = (await res.json()) as ApiResponse<VerificationResponse>;
    expect(json.success).toBeFalsy();
    expect(json.error).toBeDefined();
  });

  it('POST verify with mismatched message content', async () => {
    // Skip if no token sales exist
    if (!tokenSaleAddress) {
      console.log('No token sales found, skipping verify test');
      return;
    }

    // Sign message for one token sale but submit different message content
    const { signature, address } = await signVerificationData(1, tokenSaleAddress, daoChainId);
    const wrongMessage = {
      saleAddress: '0x1234567890123456789012345678901234567890',
      signerAddress: address,
      timestamp: Math.floor(Date.now() / 1000),
    };

    const res = await app.request(
      `/d/${daoChainId}/${daoAddress}/sales/${tokenSaleAddress}/verify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          message: wrongMessage,
          signature,
        }),
      },
    );

    expect(res.status).toBe(401);
    const json = (await res.json()) as ApiResponse<VerificationResponse>;
    expect(json.success).toBeFalsy();
    expect(json.error).toBeDefined();
  });

  it('POST verify with expired timestamp', async () => {
    // Skip if no token sales exist
    if (!tokenSaleAddress) {
      console.log('No token sales found, skipping verify test');
      return;
    }

    // Create a timestamp from 10 minutes ago (older than 5 minute limit)
    const expiredTimestamp = Math.floor(Date.now() / 1000) - 10 * 60;
    const { message, signature, address } = await signVerificationData(
      1,
      tokenSaleAddress,
      daoChainId,
      expiredTimestamp,
    );

    const res = await app.request(
      `/d/${daoChainId}/${daoAddress}/sales/${tokenSaleAddress}/verify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          message,
          signature,
        }),
      },
    );

    expect(res.status).toBe(400);
    const json = (await res.json()) as ApiResponse<VerificationResponse>;
    expect(json.success).toBeFalsy();
    expect(json.error).toBeDefined();
    expect(json.error?.message).toContain('timestamp is too old');
  });
});
