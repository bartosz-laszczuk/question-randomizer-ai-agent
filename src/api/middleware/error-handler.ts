/**
 * Global Error Handler Middleware
 *
 * Catches all errors and returns consistent error responses.
 * Logs errors with appropriate level based on type.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../utils/errors.js';
import logger from '../../utils/logger.js';

/**
 * Error response interface
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
}

/**
 * Global error handler middleware
 *
 * Must be registered AFTER all routes
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error with context
  const logContext = {
    err,
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    ip: req.ip,
  };

  // Handle known error types
  if (err instanceof AppError) {
    // Application errors (expected)
    logger.warn(logContext, `Application error: ${err.message}`);

    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  if (err instanceof ZodError) {
    // Validation errors from Zod
    logger.warn(logContext, 'Validation error');

    const errorResponse: ErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: {
          issues: err.errors.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
      },
      timestamp: new Date().toISOString(),
    };

    res.status(400).json(errorResponse);
    return;
  }

  // Unknown errors (unexpected)
  logger.error(logContext, `Unexpected error: ${err.message}`);

  // Don't leak error details in production
  const isDevelopment = process.env['NODE_ENV'] !== 'production';

  const errorResponse: ErrorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: isDevelopment
        ? err.message
        : 'An unexpected error occurred',
      ...(isDevelopment && {
        details: {
          stack: err.stack,
        },
      }),
    },
    timestamp: new Date().toISOString(),
  };

  res.status(500).json(errorResponse);
}

/**
 * 404 Not Found handler
 *
 * Must be registered AFTER all routes but BEFORE error handler
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const errorResponse: ErrorResponse = {
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.path}`,
    },
    timestamp: new Date().toISOString(),
  };

  res.status(404).json(errorResponse);
}
