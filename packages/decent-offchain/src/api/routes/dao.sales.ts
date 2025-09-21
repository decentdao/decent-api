import { Hono } from 'hono';
import { and, eq } from 'drizzle-orm';
import { zeroAddress } from 'viem';
import { bearerAuth } from '@/api/middleware/auth';
import { daoExists } from '@/api/middleware/dao';
import { checkRequirements } from '@/lib/requirements';
import { signVerification, getAddressNonce, formatVerificationData } from '@/lib/verifier';
import resf, { ApiError } from '@/api/utils/responseFormatter';
import { TokenSaleRequirements, TokenSaleRequirementType } from '@/lib/requirements/types';
import { onchainProposalTable } from '@/db/schema/onchain';
import { db } from '@/db';
import { generateWebSdkLink } from '@/lib/sumsub';

const app = new Hono();

/**
 * @title List sales for DAO
 * @route GET /d/{chainId}/{address}/sales
 * @param {string} chainId - The blockchain network ID
 * @param {string} address - The DAO address
 * @returns {object[]} Array of sales
 */
app.get('/', daoExists, async c => {
  const daoInfo = c.get('basicDaoInfo');
  const { chainId, address: daoAddress } = daoInfo;

  try {
    const sales = await db
      .select()
      .from(onchainProposalTable)
      .where(
        and(
          eq(onchainProposalTable.daoAddress, daoAddress),
          eq(onchainProposalTable.daoChainId, chainId),
        ),
      );

    return resf(c, sales);
  } catch {
    throw new ApiError('Failed to fetch sales', 500);
  }
});

/**
 * @title Verify wallet eligibility
 * @route POST /d/{chainId}/{address}/sales/{tokenSaleAddress}/verify
 * @param {string} chainId - The blockchain network ID
 * @param {string} address - The DAO address
 * @param {string} tokenSaleAddress - The token sale contract address
 * @returns {object} Verification result with signature or KYC URL
 */
app.post('/:tokenSaleAddress', bearerAuth, daoExists, async c => {
  const user = c.get('user');
  const daoInfo = c.get('basicDaoInfo');
  const address = user.address;
  const chainId = daoInfo.chainId;
  const daoAddress = daoInfo.address;

  const operator = zeroAddress; // TODO: token sale

  try {
    // 1. Get token sale requirements from DB (sample for now)
    const requirements: TokenSaleRequirements = {
      buyerRequirements: [
        {
          type: TokenSaleRequirementType.ERC721,
          tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: 1n,
        },
        {
          type: TokenSaleRequirementType.ERC20,
          tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: 1000000n,
        },
      ],
      kyc: {
        type: TokenSaleRequirementType.KYC,
        provider: 'sumsub',
        levelName: 'basic',
      },
      orOutOf: 1, // User needs to meet at least 1 of the 2 requirements
    };

    // 2. Run verification checks
    const checkResult = await checkRequirements(chainId, address, requirements);

    if (!checkResult.eligible) {
      // Return KYC URL if needed, or failure reason
      return resf(c, {
        success: false,
        reason: checkResult.reason,
        kycUrl: checkResult.kycUrl,
      });
    }
    // 3. Get address nonce
    const nonce = await getAddressNonce(chainId, address);

    // 4. Create and sign verification data
    const verificationData = formatVerificationData(operator, address, nonce);

    const signature = await signVerification(chainId, verificationData);

    return resf(c, signature);
  } catch {
    throw new ApiError('Verification failed', 500);
  }
});

export default app;
