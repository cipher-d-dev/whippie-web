import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status: number =
    typeof err.status === "number" ? err.status : 500;

  const message: string =
    process.env["NODE_ENV"] === "production" && status >= 500
      ? "Internal server error"
      : (err.message ?? "Internal server error");

  res.status(status).json({ success: false, message });
};
