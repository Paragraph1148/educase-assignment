import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types/school.types";

// ─── 404 Handler ──────────────────────────────────────────────────────────────

export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse<null> = {
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  };
  res.status(404).json(response);
};

// ─── Global Error Handler ─────────────────────────────────────────────────────

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  console.error(`[ERROR] ${err.message}`);

  const response: ApiResponse<null> = {
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  };

  res.status(500).json(response);
};
