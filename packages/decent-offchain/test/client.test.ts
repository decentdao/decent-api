import { beforeAll } from 'bun:test';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { mainnet } from 'viem/chains';
import { createSiweMessage } from 'viem/siwe';
import { cookieName } from '@/api/utils/cookie';
import { db } from '@/db';
import { schema } from '@/db/schema';

let sessionId = 'blank';

// delete all sessions before running tests
beforeAll(async () => {
  await db.delete(schema.sessionTable).execute();
});

const specPrivateKey = process.env.TEST_PRIVATE_KEY_1 as `0x${string}`;
const TEST_PRIVATE_KEY = specPrivateKey || generatePrivateKey();

export const testAccount = privateKeyToAccount(TEST_PRIVATE_KEY);
console.log(`WALLET_ADDRESS: ${testAccount.address}`);

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

export const setSessionId = (id: string) => {
  sessionId = id;
};

export const cookies = () => {
  return {
    Cookie: `${cookieName}=${sessionId}`
  };
};
