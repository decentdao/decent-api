import { privateKeyToAccount } from 'viem/accounts';

// TYPES =====================
type VerificationResponse = {
  signature: `0x${string}`;
  expiration: number;
};

type KYCResponse = {
  kyc: string; // KYC URL or token depending on kycResponseType
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
  }
}
// ==========================

const API_BASE_URL = 'https://api.decent.build';
// const API_BASE_URL = 'http://localhost:3005';
const chainId = 11155111;
const daoAddress = '0x9a3bbab42f8e3226e1bb37713908b38a2413756d';
const tokenSaleAddress = '0x0da3464a34a9595c76c4954332ffc207a3c633ff';

const PRIVATE_KEY = process.env.TEST_PRIVATE_KEY_1 as `0x${string}`;

if (!PRIVATE_KEY) throw new Error('TEST_PRIVATE_KEY_1 is not set');

const account = privateKeyToAccount(PRIVATE_KEY);
const userAddress = account.address;

// EIP-712 types for token sale verification
const VERIFICATION_TYPES = {
  Verification: [
    { name: 'saleAddress', type: 'address' },
    { name: 'signerAddress', type: 'address' },
    { name: 'timestamp', type: 'uint256' },
  ],
};

// Create typed data structure for signing
const typedData = {
  domain: {
    name: 'Decent Token Sale',
    version: '1',
    chainId,
  },
  types: VERIFICATION_TYPES,
  primaryType: 'Verification' as const,
  message: {
    saleAddress: tokenSaleAddress,
    signerAddress: userAddress,
    timestamp: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
  },
};

try {
  // Sign the typed data with the local account
  const signature = await account.signTypedData(typedData);

  // Send verification request
  const kycResponseType = 'url'; // or 'token'
  const response = await fetch(
    `${API_BASE_URL}/d/${chainId}/${daoAddress}/sales/${tokenSaleAddress}/verify?kycResponseType=${kycResponseType}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: userAddress,
        message: typedData.message,
        signature,
      }),
    }
  );

  const result = await response.json() as ApiResponse<VerificationResponse | KYCResponse>;

  if (result.success && result.data) {
    if ('kyc' in result.data) {
      console.log(`KYC required: ${result.data.kyc}`);
    }

    if ('signature' in result.data) {
      console.log(`Signature: ${result.data.signature}`);
      console.log(`Expiration: ${result.data.expiration}`);
    }

  } else {
    console.error('Verification failed:', result.error?.message);
    // Handle verification failure
  }
} catch (error) {
  console.error('Error during verification:', error);
  // Handle network or signing errors
}

export {};
