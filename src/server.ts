/**
 * Question Randomizer AI Agent Service
 *
 * Main server entry point.
 * Initializes Express server with middleware and routes.
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env, logEnvironmentConfig, isDevelopment } from './config/environment.js';
import logger from './utils/logger.js';
import { requestLogger } from './api/middleware/request-logger.js';
import { errorHandler, notFoundHandler } from './api/middleware/error-handler.js';
import healthRoutes from './api/routes/health.routes.js';
import agentRoutes from './api/routes/agent.routes.js';
import { startAgentWorker, stopAgentWorker } from './queue/workers/agent-worker.js';
import { closeQueue } from './queue/task-queue.js';
import { closeRedisConnection } from './config/redis.config.js';

/**
 * Create and configure Express application
 */
function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: isDevelopment
        ? '*' // Allow all origins in development
        : ['http://localhost:4200'], // Restrict to frontend in production
      credentials: true,
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Request logging middleware
  app.use(requestLogger);

  // Routes
  app.use(healthRoutes);
  app.use(agentRoutes);

  // 404 handler (must be after all routes)
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    // Log environment configuration
    logEnvironmentConfig();

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server started successfully`);
      logger.info(`📡 Listening on port ${env.PORT}`);
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);
      logger.info(`📋 Health check: http://localhost:${env.PORT}/health`);
      logger.info('');
      logger.info('✅ Question Randomizer AI Agent Service is ready!');
    });

    // Start agent worker for queue processing
    startAgentWorker();
    logger.info('🔄 Agent worker started');

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      // Close connections in order
      try {
        // Stop accepting new requests
        server.close(() => {
          logger.info('HTTP server closed');
        });

        // Stop worker from accepting new jobs
        await stopAgentWorker();
        logger.info('Agent worker stopped');

        // Close queue connections
        await closeQueue();
        logger.info('Queue connections closed');

        // Close Redis connection
        await closeRedisConnection();
        logger.info('Redis connection closed');

        logger.info('Graceful shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error({ err: error }, 'Error during shutdown');
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.fatal({ err: error }, 'Uncaught exception');
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.fatal({ reason, promise }, 'Unhandled rejection');
      process.exit(1);
    });
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

// Export for testing
export { createApp, startServer };
