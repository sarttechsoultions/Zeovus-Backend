import type { ErrorRequestHandler, RequestHandler } from 'express';
import { env } from '../config/env.js';

export const notFound: RequestHandler = (_request, response) => {
  response.status(404).json({ success: false, message: 'Route not found' });
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  const candidate = error as { status?: unknown; statusCode?: unknown; code?: string } | null;
  const value = candidate?.code === "LIMIT_FILE_SIZE" ? 413 : candidate?.code?.startsWith("LIMIT_") ? 400 : candidate?.status ?? candidate?.statusCode;
  const status = typeof value === 'number' && value >= 400 && value <= 599 ? value : 500;
  if (status >= 500) console.error(error);
  response.status(status).json({ success: false, message: status >= 500 && env.NODE_ENV === 'production' ? 'Internal server error' : error instanceof Error ? error.message : 'Request failed' });
};

