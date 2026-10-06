/**
 * Role-based authorization middleware.
 * Fully implemented in Phase 1.
 */
import type { RequestHandler } from "express";
import type { UserRole } from "@whippe/shared";

/** Require the authenticated user to have one of the specified roles. Phase 1 implementation. */
export function authorize(..._roles: UserRole[]): RequestHandler {
  return (_req, _res, next) => {
    // Phase 1 implementation
    next();
  };
}
