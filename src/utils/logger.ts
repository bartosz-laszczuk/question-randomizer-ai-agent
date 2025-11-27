/**
 * Pino Logger Configuration
 *
 * Provides structured logging with:
 * - Request IDs for tracing
 * - Different log levels (debug, info, warn, error)
 * - Pretty printing in development
 * - JSON output in production
 */

import pino from 'pino';

const isDevelopment = process.env['NODE_ENV'] !== 'production';
const isTest = process.env['NODE_ENV'] === 'test';

/**
 * Logger transport configuration
 */
const transportConfig = isDevelopment && !isTest
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        singleLine: false,
      },
    }
  : undefined;

/**
 * Create Pino logger instance
 */
export const logger = pino({
  level: process.env['LOG_LEVEL'] || (isDevelopment ? 'debug' : 'info'),

  // Pretty print in development, JSON in production
  ...(transportConfig && { transport: transportConfig }),

  // Base configuration
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },

  // Serialize errors properly
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },

  // Base fields
  base: {
    pid: process.pid,
    env: process.env['NODE_ENV'] || 'development',
  },

  // Timestamp
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Create child logger with additional context
 *
 * @example
 * const requestLogger = createChildLogger({ requestId: 'req_123' });
 * requestLogger.info('Processing request');
 */
export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}

/**
 * Log levels:
 * - trace: Very detailed debugging
 * - debug: Debugging information
 * - info: General information
 * - warn: Warning messages
 * - error: Error messages
 * - fatal: Fatal errors (will exit process)
 */

// Export logger as default
export default logger;
