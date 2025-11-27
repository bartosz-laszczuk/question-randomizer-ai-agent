/**
 * Request Logger Middleware
 *
 * Logs HTTP requests and responses with timing and context.
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { createChildLogger } from '../../utils/logger.js';
import { env } from '../../config/environment.js';

/**
 * Request logger middleware
 *
 * Adds request ID and logs request/response details
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip logging if disabled
  if (!env.ENABLE_REQUEST_LOGGING) {
    next();
    return;
  }

  // Generate unique request ID
  const requestId = randomUUID();

  // Create child logger with request context
  const reqLogger = createChildLogger({ requestId });

  // Attach logger to request for use in handlers
  (req as any).logger = reqLogger;

  // Start timer
  const startTime = Date.now();

  // Log incoming request
  reqLogger.info({
    event: 'request_started',
    method: req.method,
    path: req.path,
    query: req.query,
    userAgent: req.get('user-agent'),
    ip: req.ip,
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    reqLogger.info({
      event: 'request_completed',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    });
  });

  next();
}
