import { Hono } from 'hono';
import { Address, getAddress } from 'viem';
import { and, eq } from 'drizzle-orm';
import { daoExists } from '@/api/middleware/dao';
import resf, { ApiError } from '@/api/utils/responseFormatter';
import { checkRequirements } from '@/lib/requirements';
import { KYCResponseType } from '@/lib/sumsub/types';
import { signVerification, getAddressNonce, formatVerificationData } from '@/lib/verifier';
import { tokenSaleTable } from '@/db/schema/onchain';
import { db } from '@/db';
import { getPublicClient } from '../utils/publicClient';
import { unixTimestamp } from '../utils/time';

const VERIFICATION_TYPES = {
  Verification: [
    { name: 'saleAddress', type: 'address' },
    { name: 'signerAddress', type: 'address' },
    { name: 'timestamp', type: 'uint256' },
  ],
};

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

  const sales = await db
    .select({
      tokenSaleAddress: tokenSaleTable.tokenSaleAddress,
      tokenSaleName: tokenSaleTable.tokenSaleName,
      tokenSaleRequirements: tokenSaleTable.tokenSaleRequirements,
    })
    .from(tokenSaleTable)
    .where(and(eq(tokenSaleTable.daoAddress, daoAddress), eq(tokenSaleTable.daoChainId, chainId)));

  return resf(c, sales);
});

/**
 * @title Verify wallet eligibility
 * @route POST /d/{chainId}/{address}/sales/{tokenSaleAddress}/verify
 * @param {string} chainId - The blockchain network ID
 * @param {string} address - The DAO address
 * @param {string} tokenSaleAddress - The token sale contract address
 * @param {string} [kycResponseType] - Optional KYC response type query parameter ('url' or 'token', defaults to 'url')
 * @body { address: string, message: string, signature: string }
 * @returns {object} Verification result with signature or KYC URL
 */
app.post('/:tokenSaleAddress/verify', daoExists, async c => {
  const { tokenSaleAddress } = c.req.param();
  const daoInfo = c.get('basicDaoInfo');
  const chainId = daoInfo.chainId;
  const daoAddress = daoInfo.address;

  if (!tokenSaleAddress) throw new ApiError('Must supply tokenSaleAddress', 400);
  const lowerTokenSaleAddress = getAddress(tokenSaleAddress).toLowerCase() as Address;

  // 0. Verify signed typed data
  const { address, message, signature } = await c.req.json();
  if (!message) throw new ApiError('Missing message', 400);
  if (!signature) throw new ApiError('Missing signature', 400);
  const publicClient = getPublicClient(chainId);

  const domain = {
    name: 'Decent DAO Verification',
    version: '1',
    chainId,
  };

  // Validate timestamp is recent (within last 5 minutes)
  const now = unixTimestamp();
  const maxAge = 5 * 60;
  if (message.timestamp && now - message.timestamp > maxAge) {
    throw new ApiError('Message timestamp is too old', 400);
  }

  const valid = await publicClient.verifyTypedData({
    address,
    domain,
    types: VERIFICATION_TYPES,
    primaryType: 'Verification',
    message,
    signature,
  });
  if (!valid) throw new ApiError(`Bad signed message from ${address}`, 401);

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
  const kycResponseType = (c.req.query('kycResponseType') || 'url') as KYCResponseType;
  if (kycResponseType !== 'url' && kycResponseType !== 'token') {
    throw new ApiError('Unsupported kycResponseType requested', 400);
  }

  const { eligible, kyc, ineligibleReason } = await checkRequirements(
    chainId,
    address,
    sale.tokenSaleRequirements,
    kycResponseType,
  );

  // Return KYC URL or access token if required and address is not in database
  if (kyc) return resf(c, { kyc });

  // Return reasons if onchain requirements not met
  if (!eligible && ineligibleReason) throw new ApiError(ineligibleReason, 401);

  // 3. Get address nonce
  const nonce = await getAddressNonce(chainId, address);

  // 4. Create and sign verification data
  const verificationData = formatVerificationData(sale.tokenSaleAddress, address, nonce);

  const verify = await signVerification(chainId, verificationData);

  return resf(c, verify);
});

export default app;
