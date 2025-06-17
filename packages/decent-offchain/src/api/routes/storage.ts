import { Hono } from 'hono';
import { S3Client } from 'bun';
import resf from '@/api/utils/responseFormatter';

const app = new Hono();

const s3 = new S3Client({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  endpoint: process.env.S3_ENDPOINT,
  bucket: process.env.S3_BUCKET_NAME,
  region: 'auto',
});

/**
 * @title Get the template service agreement
 * @route GET /storage/template
 * @returns {url} - The presigned URL for the template service agreement
 */
app.get('/template', async (c) => {
  const url = s3.presign('template:service-agreement.pdf', {
    expiresIn: 600,
  });

  return resf(c, { url });
});

export default app;
