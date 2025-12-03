/**
 * Redis Configuration
 *
 * Manages Redis connection for BullMQ queue and caching.
 */

import Redis, { type RedisOptions } from 'ioredis';
import { env, isTest } from './environment.js';
import logger from '../utils/logger.js';

/**
 * Redis connection options
 */
const redisOptions: RedisOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false, // Required for BullMQ
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

// Add password if configured
if (env.REDIS_PASSWORD) {
  redisOptions.password = env.REDIS_PASSWORD;
}

// Enable TLS if configured
if (env.REDIS_TLS) {
  redisOptions.tls = {};
}

/**
 * Create Redis connection
 */
export function createRedisConnection(name = 'default'): Redis {
  // In test environment, use in-memory Redis mock if needed
  if (isTest) {
    logger.debug('Creating Redis connection for test environment');
  }

  const redis = new Redis(redisOptions);

  redis.on('connect', () => {
    logger.info({ name }, 'Redis connection established');
  });

  redis.on('error', (error) => {
    logger.error({ err: error, name }, 'Redis connection error');
  });

  redis.on('close', () => {
    logger.warn({ name }, 'Redis connection closed');
  });

  return redis;
}

/**
 * Shared Redis connection for general use
 */
export const redis = createRedisConnection('main');

/**
 * Test Redis connection
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    await redis.ping();
    logger.info('Redis connection test: OK');
    return true;
  } catch (error) {
    logger.error({ err: error }, 'Redis connection test: FAILED');
    return false;
  }
}

/**
 * Close Redis connection gracefully
 */
export async function closeRedisConnection(): Promise<void> {
  try {
    await redis.quit();
    logger.info('Redis connection closed gracefully');
  } catch (error) {
    logger.error({ err: error }, 'Error closing Redis connection');
    redis.disconnect();
  }
}
