import { Hono } from 'hono';
import { Address, getAddress } from 'viem';
import { and, eq } from 'drizzle-orm';
import { bearerAuth } from '@/api/middleware/auth';
import { daoExists } from '@/api/middleware/dao';
import resf, { ApiError } from '@/api/utils/responseFormatter';
import { checkRequirements } from '@/lib/requirements';
import { signVerification, getAddressNonce, formatVerificationData } from '@/lib/verifier';
import { tokenSaleTable } from '@/db/schema/onchain';
import { db } from '@/db';

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
      .select({
        tokenSaleAddress: tokenSaleTable.tokenSaleAddress,
        tokenSaleName: tokenSaleTable.tokenSaleName,
        tokenSaleRequirements: tokenSaleTable.tokenSaleRequirements
      })
      .from(tokenSaleTable)
      .where(
        and(
          eq(tokenSaleTable.daoAddress, daoAddress),
          eq(tokenSaleTable.daoChainId, chainId),
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
app.post('/:tokenSaleAddress/verify', bearerAuth, daoExists, async c => {
  const { tokenSaleAddress } = c.req.param();
  const user = c.get('user');
  const daoInfo = c.get('basicDaoInfo');
  const address = user.address;
  const chainId = daoInfo.chainId;
  const daoAddress = daoInfo.address;

  if (!tokenSaleAddress) throw new ApiError('Must supply tokenSaleAddress', 400);
  const lowerTokenSaleAddress = getAddress(tokenSaleAddress).toLowerCase() as Address;

  try {
    // 1. Get token sale requirements from DB
    const [sale] = await db
      .select()
      .from(tokenSaleTable)
      .where(
        and(
          eq(tokenSaleTable.daoAddress, daoAddress),
          eq(tokenSaleTable.daoChainId, chainId),
          eq(tokenSaleTable.tokenSaleAddress, lowerTokenSaleAddress),
        ),
      )
      .limit(1);

    if (!sale) throw new ApiError('Sale not found', 404);

    // 2. Run verification checks
    const checkResult = await checkRequirements(chainId, address, sale.tokenSaleRequirements);

    // Return KYC URL if needed, or failure reason
    if (checkResult.kycUrl) {
      return resf(c, {
        success: false,
        reason: checkResult.reason,
        kycUrl: checkResult.kycUrl,
      });
    }

    // 3. Get address nonce
    const nonce = await getAddressNonce(chainId, address);

    // 4. Create and sign verification data
    const verificationData = formatVerificationData(sale.tokenSaleAddress, address, nonce);

    const signature = await signVerification(chainId, verificationData);

    return resf(c, signature);
  } catch {
    throw new ApiError('Verification failed', 500);
  }
});

export default app;
