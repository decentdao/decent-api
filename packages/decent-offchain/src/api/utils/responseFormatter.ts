import { Context } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { ApiResponse } from "../types";

export class ApiError extends Error {
  constructor(message: string, public status?: ContentfulStatusCode) {
    super(message);
  }
}

export default function formatResponse<T>(c: Context, d: T, _status?: ContentfulStatusCode): Response {
  if (d instanceof ApiError || d instanceof Error) {
    const status = (d as ApiError).status || 500;
    const response: ApiResponse<T> = {
      success: false,
      error: {
        message: d.message,
      },
    }
    if (!_status) console.error(d);
    return c.json(response, status);
  }

  const response: ApiResponse<T> = {
    success: true,
    data: d,
  }
  const status = _status || 200;
  return c.json(response, status);
}
