import { Context } from "hono";
import { ApiResponse } from "../types";

export default function formatResponse<T>(c: Context, d: T): Response {
  if (d instanceof Error) {
    const response: ApiResponse<T> = {
      success: false,
      error: {
        message: d.message,
        code: d.name,
      },
    }
    return c.json(response, 500);
  }

  const response: ApiResponse<T> = {
    success: true,
    data: d,
  }
  return c.json(response, 200);
}
