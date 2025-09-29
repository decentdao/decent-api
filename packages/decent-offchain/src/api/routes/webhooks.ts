import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import resf, { ApiError } from '@/api/utils/responseFormatter';
import { SumsubWebhookPayload } from '@/lib/sumsub/types';
import { verifyWebhookSignature } from '@/lib/sumsub';
import { kycTable } from '@/db/schema/offchain/kyc';
import { db } from '@/db';

const app = new Hono();

/**
 * @title Sumsub KYC Webhook
 * @route POST /webhooks/sumsub
 * @description Handles KYC completion notifications from Sumsub
 */
app.post('/sumsub', async c => {
  try {
    const bodyBytes = Buffer.from(await c.req.arrayBuffer());
    const digest = c.req.header('x-payload-digest');
    if (!digest) throw new ApiError('Missing digest', 400);

    const isValidSignature = verifyWebhookSignature(bodyBytes, digest);
    if (!isValidSignature) throw new ApiError('Bad signature', 401);

    // Parse JSON payload after signature verification
    const payload: SumsubWebhookPayload = JSON.parse(bodyBytes.toString());

    if (payload.type === 'applicantReviewed') {
      await updateKycStatus(payload);
    }

    return resf(c, { received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 for processing errors to prevent retries, but 401 for auth failures
    if (error instanceof SyntaxError) {
      return c.json({ error: 'Invalid JSON payload' }, 400);
    }
    return resf(c, { received: true, error: 'Processing failed' });
  }
});

async function updateKycStatus(payload: SumsubWebhookPayload) {
  try {
    const { externalUserId, applicantId, sandboxMode, reviewResult, reviewStatus } = payload;
    const isKycApproved = reviewResult.reviewAnswer === 'GREEN';
    const rejectLabels = isKycApproved ? null : reviewResult.rejectLabels;

    // Find the KYC record by our internal ID
    const kycRecord = await db.query.kycTable.findFirst({
      where: eq(kycTable.id, externalUserId),
    });

    if (!kycRecord) {
      // Don't throw error otherwise Sumsub will retry
      // This is probably spam
      console.error(`KYC record not found for externalUserId: ${externalUserId}`);
      return;
    }

    await db
      .update(kycTable)
      .set({
        isKycApproved,
        sandboxMode,
        rejectLabels,
        reviewStatus,
        applicantId,
      })
      .where(eq(kycTable.id, externalUserId));

    console.log(
      `Successfully updated KYC status for user ${kycRecord.address} (ID: ${externalUserId})`,
    );
  } catch (error) {
    console.error('Database update error:', error);
    throw error;
  }
}

export default app;
