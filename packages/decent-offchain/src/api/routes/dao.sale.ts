import { Hono } from 'hono';
import { bearerAuth } from '@/api/middleware/auth';
import { daoExists } from '@/api/middleware/dao';
import { verifier } from '@/lib/verification';
import { signVerification, getVerificationData } from '@/lib/signer';
import { getPublicClient } from '../utils/publicClient';
import resf, { ApiError } from '@/api/utils/responseFormatter';
import { TokenSaleVerification } from '@/lib/verification/types';
import { zeroAddress } from 'viem';

const app = new Hono();

const VERIFIER_ABI = [
  {
    name: 'nonce',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account_', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

/**
 * @title Verify wallet eligibility for token sale
 * @route POST /d/{chainId}/{address}/sale/verify
 * @param {string} chainId - The blockchain network ID
 * @param {string} address - The DAO address
 * @param {string} tokenSaleId - The token sale identifier
 * @returns {object} Verification result with signature or KYC URL
 */
app.post('/d/:chainId/:address/sale/verify', bearerAuth, daoExists, async c => {
  const user = c.get('user');
  const daoInfo = c.get('basicDaoInfo');
  const address = user.address;
  const chainId = daoInfo.chainId;

  const operator = zeroAddress; // TODO
  const verifierContract = zeroAddress; // TODO

  try {
    // 1. Get token sale requirements from DB (sample for now)
    const requirements = {
      operator: 'AND',
      methods: [
        {
          type: 'whitelist',
          allowedAddresses: [address],
        },
        {
          type: 'erc20',
          contract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: '1000000',
          operator: 'gte',
        },
        {
          type: 'kyc',
          provider: 'sumsub',
          levelName: 'basic',
        },
      ],
    } satisfies TokenSaleVerification;

    // 2. Run verification checks
    const checkResult = await verifier(chainId, address, requirements);

    if (!checkResult.eligible) {
      // Return KYC URL if needed, or failure reason
      return resf(c, {
        success: false,
        reason: checkResult.reason,
        kycUrl: checkResult.kycUrl,
      });
    }

    // 3. Fetch nonce for address
    const client = getPublicClient(chainId);
    const nonce = await client.readContract({
      address: verifierContract,
      abi: VERIFIER_ABI,
      functionName: 'nonce',
      args: [address],
    });

    // 4. Create and sign verification data
    const verificationData = await getVerificationData(
      operator,
      address,
      60, // 60 min expiry
      nonce,
    );

    const signature = await signVerification(chainId, verifierContract, verificationData);

    return resf(c, {
      signature,
      data: verificationData,
    });
  } catch {
    throw new ApiError('Verification failed', 500);
  }
});

export default app;
