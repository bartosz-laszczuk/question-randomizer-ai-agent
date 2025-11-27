/**
 * Health Check Routes
 *
 * Provides health check endpoints for monitoring and orchestration.
 * - /health: Full health check with dependency status
 * - /ready: Kubernetes readiness probe
 * - /live: Kubernetes liveness probe
 */

import { Router, Request, Response } from 'express';
import { verifyFirestoreConnection } from '../../config/firebase.config.js';
import { verifyAnthropicConnection } from '../../config/anthropic.config.js';
import logger from '../../utils/logger.js';

const router = Router();

/**
 * Health check response type
 */
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    firestore: 'healthy' | 'unhealthy' | 'checking';
    anthropic: 'healthy' | 'unhealthy' | 'not_checked';
  };
  uptime: number;
  version: string;
}

/**
 * GET /health
 * Full health check with all dependencies
 *
 * Returns 200 if healthy, 503 if degraded/unhealthy
 */
router.get('/health', async (_req: Request, res: Response) => {
  const startTime = Date.now();

  const health: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      firestore: 'checking',
      anthropic: 'not_checked',
    },
    uptime: process.uptime(),
    version: process.env['npm_package_version'] || '1.0.0',
  };

  try {
    // Check Firestore connection
    const firestoreHealthy = await verifyFirestoreConnection();
    health.checks.firestore = firestoreHealthy ? 'healthy' : 'unhealthy';

    if (!firestoreHealthy) {
      health.status = 'degraded';
    }

    // Check Anthropic connection (basic validation)
    const anthropicHealthy = await verifyAnthropicConnection();
    health.checks.anthropic = anthropicHealthy ? 'healthy' : 'unhealthy';

    if (!anthropicHealthy) {
      health.status = 'degraded';
    }

    // If both critical services are down, mark as unhealthy
    if (!firestoreHealthy && !anthropicHealthy) {
      health.status = 'unhealthy';
    }

    const duration = Date.now() - startTime;
    logger.debug(
      { health, duration },
      `Health check completed in ${duration}ms`
    );

    // Return appropriate status code
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error({ err: error }, 'Health check failed');

    health.status = 'unhealthy';
    health.checks.firestore = 'unhealthy';
    health.checks.anthropic = 'unhealthy';

    res.status(503).json(health);
  }
});

/**
 * GET /ready
 * Kubernetes readiness probe
 *
 * Returns 200 if ready to accept traffic, 503 otherwise
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Check if critical dependencies are available
    const firestoreReady = await verifyFirestoreConnection();

    if (firestoreReady) {
      res.status(200).json({
        ready: true,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        ready: false,
        reason: 'Firestore connection not available',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error({ err: error }, 'Readiness check failed');
    res.status(503).json({
      ready: false,
      reason: 'Service not ready',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /live
 * Kubernetes liveness probe
 *
 * Returns 200 if process is alive, 503 otherwise
 */
router.get('/live', (_req: Request, res: Response) => {
  // Simple liveness check - if we can respond, we're alive
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
