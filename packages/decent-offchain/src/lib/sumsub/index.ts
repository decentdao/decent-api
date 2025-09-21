import { createHmac } from 'crypto';
import { ResponseWebSdkUrl, SumsubRequest, SumsubResponse } from './types';
import { unixTimestamp } from '@/api/utils/time';
import { DEFAULT_LEVEL_NAME, DEFAULT_TTL_IN_SEC, BASE_API, WEB_SDK_ENDPOINT } from './constants';

const SUMSUB_TOKEN = process.env.SUMSUB_TOKEN;
const SUMSUB_SECRET_KEY = process.env.SUMSUB_SECRET_KEY;

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

export async function generateWebSdkLink() {
  const data = {
    levelName: DEFAULT_LEVEL_NAME,
    ttlInSecs: DEFAULT_TTL_IN_SEC,
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
