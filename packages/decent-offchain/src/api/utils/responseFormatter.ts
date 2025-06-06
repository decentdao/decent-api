import { Context } from 'hono';
import { ContentfulStatusCode } from 'hono/utils/http-status';
import { ApiResponse } from 'decent-sdk';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: ContentfulStatusCode,
  ) {
    super(message);
    this.status = status;
  }
}

function convertBigIntToString<T>(input: T): T {
  if (typeof input === 'bigint') {
    // Convert single BigInt
    return input.toString() as unknown as T;
  } else if (Array.isArray(input)) {
    // Recursively handle arrays
    return input.map(item => convertBigIntToString(item)) as unknown as T;
  } else if (input !== null && typeof input === 'object') {
    // Recursively handle objects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = {};
    for (const [key, value] of Object.entries(input)) {
      result[key] = convertBigIntToString(value);
    }
    return result as T;
  }
  // All other types remain unchanged
  return input;
}

export default function formatResponse<T>(
  c: Context,
  d: T,
  _status?: ContentfulStatusCode,
): Response {
  if (d instanceof ApiError || d instanceof Error) {
    const status = (d as ApiError).status || 500;
    const response: ApiResponse<T> = {
      success: false,
      error: {
        message: d.message,
      },
    };
    if (!_status) console.error(d);
    return c.json(response, status);
  }

  const response: ApiResponse<T> = {
    success: true,
    data: convertBigIntToString(d),
  };
  const status = _status || 200;
  return c.json(response, status);
}
