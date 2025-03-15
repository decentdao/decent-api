import { Context } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { ApiResponse } from "../types";

export default function formatResponse<T>(c: Context, d: T, _status?: ContentfulStatusCode): Response {
  if (d instanceof Error) {
    const status = _status || 500;
    const response: ApiResponse<T> = {
      success: false,
      error: {
        type: d.name.toLowerCase(),
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
  return c.json(response, _status);
}
