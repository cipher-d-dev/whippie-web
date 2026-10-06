/**
 * Authentication middleware.
 * Fully implemented in Phase 1.
 * Placeholder exists here so imports resolve from the start.
 */
import type { RequestHandler } from "express";

/** Require an authenticated session. Phase 1 provides the real implementation. */
export const requireAuth: RequestHandler = (_req, _res, next) => {
  // Phase 1 implementation
  next();
};
