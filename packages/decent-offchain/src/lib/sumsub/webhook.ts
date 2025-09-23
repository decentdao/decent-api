// https://docs.sumsub.com/docs/webhook-manager#verify-webhook-sender
import { createHmac, timingSafeEqual } from 'crypto';

const SUMSUB_WEBHOOK_SECRET_KEY = process.env.SUMSUB_WEBHOOK_SECRET_KEY;

/**
 * Verify that a webhook request is from Sumsub using HMAC signature verification
 * @param rawBody - The raw request body as bytes (unmodified)
 * @param headers - Request headers containing signature and algorithm
 * @returns true if signature is valid, false otherwise
 */
export function verifyWebhookSignature(rawBody: Buffer, headers: Record<string, string>): boolean {
  try {
    if (!SUMSUB_WEBHOOK_SECRET_KEY) {
      console.error('SUMSUB_WEBHOOK_SECRET_KEY environment variable not set');
      return false;
    }

    // Extract signature and algorithm from headers
    const receivedDigest = headers['x-payload-digest'];
    const digestAlgorithm = headers['x-payload-digest-alg'];

    if (!receivedDigest) {
      console.error('Missing x-payload-digest header');
      return false;
    }

    if (!digestAlgorithm) {
      console.error('Missing x-payload-digest-alg header');
      return false;
    }

    // Validate algorithm is SHA256
    if (digestAlgorithm !== 'HMAC_SHA256_HEX') {
      console.error(`Unsupported digest algorithm: ${digestAlgorithm}. Only HMAC_SHA256_HEX is supported.`);
      return false;
    }

    // Compute HMAC digest using raw body and secret key
    const calculatedDigest = createHmac('sha256', SUMSUB_WEBHOOK_SECRET_KEY)
      .update(rawBody)
      .digest('hex');

    // Use constant-time comparison to prevent timing attacks
    try {
      return timingSafeEqual(
        Buffer.from(calculatedDigest, 'hex'),
        Buffer.from(receivedDigest, 'hex')
      );
    } catch {
      return false;
    }
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}


