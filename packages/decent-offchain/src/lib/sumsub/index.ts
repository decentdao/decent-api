import { createHmac, timingSafeEqual } from 'crypto';
import { ResponseWebSdkUrl, SumsubRequest, SumsubResponse } from './types';
import { unixTimestamp } from '@/api/utils/time';
import { DEFAULT_LEVEL_NAME, DEFAULT_TTL_IN_SEC, BASE_API, WEB_SDK_ENDPOINT } from './constants';

const SUMSUB_TOKEN = process.env.SUMSUB_TOKEN;
const SUMSUB_SECRET_KEY = process.env.SUMSUB_SECRET_KEY;
const SUMSUB_WEBHOOK_SECRET_KEY = process.env.SUMSUB_WEBHOOK_SECRET_KEY;

/**
 * Creates authenticated request configuration for Sumsub API calls
 * @param req - Request configuration including method, endpoint, and optional body
 * @returns Object containing the full URL and signed headers for the API request
 * @throws Error if SUMSUB_SECRET_KEY or SUMSUB_TOKEN environment variables are not set
 * @see https://docs.sumsub.com/docs/server-side-libraries#signing-requests
 */
export const getSumsubReq = (req: SumsubRequest) => {
  if (!SUMSUB_SECRET_KEY) throw new Error('SUMSUB_SECRET_KEY not set');
  if (!SUMSUB_TOKEN) throw new Error('SUMSUB_TOKEN not set');
  const timestamp = unixTimestamp();
  const signature = createHmac('sha256', SUMSUB_SECRET_KEY);
  const toSign = `${timestamp}${req.method}${req.endpoint}`;
  signature.update(toSign);
  if (req.method === 'POST') signature.update(req.body);

  const url = `${BASE_API}${req.endpoint}`;
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-app-token': SUMSUB_TOKEN,
    'x-app-access-ts': String(timestamp),
    'x-app-access-sig': signature.digest('hex'),
  };
  return { url, headers };
};

/**
 * Generates a temporary Web SDK URL for KYC verification
 * @param externalId - External user identifier to associate with the KYC session
 * @returns Promise resolving to the Web SDK URL for frontend integration
 * @throws Error if the Sumsub API returns an error response
 * @see https://docs.sumsub.com/docs/web-sdk-integration#generating-web-sdk-url
 */
export async function generateWebSdkLink(externalId: string) {
  const data = {
    levelName: DEFAULT_LEVEL_NAME,
    ttlInSecs: DEFAULT_TTL_IN_SEC,
    userId: externalId,
  };
  const body = JSON.stringify(data);
  const { url, headers } = getSumsubReq({
    method: 'POST',
    endpoint: WEB_SDK_ENDPOINT,
    body,
  });

  const linkRequest = await fetch(url, {
    method: 'POST',
    headers,
    body,
  });

  const response = (await linkRequest.json()) as SumsubResponse<ResponseWebSdkUrl>;

  if ('errorCode' in response) {
    throw new Error(response.description);
  }

  return response.url;
}

/**
 * Verify that a webhook request is from Sumsub using HMAC signature verification
 * note: logs errors instead of throwing them so that sumsub does not retry
 * @param body - The raw request body as bytes (unmodified)
 * @param headers - Request headers containing signature and algorithm
 * @returns true if signature is valid, false otherwise
 * @see https://docs.sumsub.com/docs/webhook-manager#verify-webhook-sender
 */
export function verifyWebhookSignature(body: Buffer, digest: string): boolean {
  try {
    if (!SUMSUB_WEBHOOK_SECRET_KEY) {
      console.error('SUMSUB_WEBHOOK_SECRET_KEY not set');
      return false;
    }

    const calculatedDigest = createHmac('sha256', SUMSUB_WEBHOOK_SECRET_KEY)
      .update(body)
      .digest('hex');

    // Use constant-time comparison to prevent timing attacks
    try {
      return timingSafeEqual(Buffer.from(calculatedDigest, 'hex'), Buffer.from(digest, 'hex'));
    } catch {
      return false;
    }
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}
