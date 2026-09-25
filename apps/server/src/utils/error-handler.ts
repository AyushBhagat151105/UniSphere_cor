import type { NextFunction, Request, Response } from "express";

import { ApiError, ApiResponse } from "./api-response";

/**
 * Global error-handling middleware aligned with Express's lifecycle.
 * Register it AFTER all routes in `src/index.ts`:
 *
 *   import { errorHandler } from "./utils/error-handler";
 *   app.use(errorHandler);
 */
export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }
  if (err instanceof ApiError) {
    res.status(err.status).json(ApiResponse.failure(err.status, err.message, err.details));
    return;
  }
  console.error("Unhandled error:", err);
  res.status(500).json(ApiResponse.internal());
}
