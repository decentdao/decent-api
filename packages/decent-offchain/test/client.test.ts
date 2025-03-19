import { beforeAll } from 'bun:test';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';
import { createSiweMessage } from "viem/siwe";
import { cookieName } from '@/api/utils/cookie';
import { db } from "@/db";
import { schema } from "@/db/schema";

// delete all sessions before running tests
beforeAll(async () => {
  await db.delete(schema.sessions).execute();
});

const TEST_PRIVATE_KEY = process.env.TEST_PRIVATE_KEY_1 as `0x${string}`;

if (!TEST_PRIVATE_KEY) {
  throw new Error('TEST_PRIVATE_KEY is not set');
}

export const testAccount = privateKeyToAccount(TEST_PRIVATE_KEY);

export const testWalletClient = createWalletClient({
  account: testAccount,
  chain: mainnet,
  transport: http(),
});

export const signedSiweMessage = async (nonce: string) => {
  const message = createSiweMessage({
    chainId: mainnet.id,
    nonce,
    address: testAccount.address,
    domain: 'localhost',
    uri: 'http://localhost:3000',
    version: '1',
  });

  const signature = await testWalletClient.signMessage({ message });

  return {
    message,
    signature,
  };
};

export const getCookie = (res: Response) => {
  const cookieHeader = res.headers.get('set-cookie') || '';
  const cookieMatch = new RegExp(`${cookieName}=([^;]+)`).exec(cookieHeader) ?? [];
  return cookieMatch[1] ?? '';
};

export const cookies = (sessionId: string) => {
  return {
    Cookie: `${cookieName}=${sessionId}`
  };
};
