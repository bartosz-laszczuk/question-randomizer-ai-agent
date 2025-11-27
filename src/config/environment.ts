/**
 * Environment Configuration with Zod Validation
 *
 * Validates and exports strongly-typed environment variables.
 * Fails fast on startup if required variables are missing or invalid.
 */

import { z } from 'zod';
import dotenv from 'dotenv';
import { ConfigurationError } from '../utils/errors.js';

// Load environment variables from .env file
dotenv.config();

/**
 * Environment variable schema
 */
const envSchema = z
  .object({
    // Server
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().min(1000).max(65535).default(3002),
    LOG_LEVEL: z
      .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
      .default('info'),

    // Firebase
    FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase project ID is required'),
    FIREBASE_CREDENTIALS_PATH: z.string().optional(),
    FIREBASE_CREDENTIALS_JSON: z.string().optional(),

    // Anthropic
    ANTHROPIC_API_KEY: z
      .string()
      .min(1, 'Anthropic API key is required')
      .startsWith('sk-ant-', 'Anthropic API key must start with sk-ant-'),

    // Redis
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().min(1).max(65535).default(6379),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_TLS: z.coerce.boolean().default(false),

    // Queue
    QUEUE_CONCURRENCY: z.coerce
      .number()
      .min(1)
      .max(10)
      .default(3)
      .describe('Number of concurrent agent tasks'),
    QUEUE_MAX_RETRIES: z.coerce
      .number()
      .min(0)
      .max(10)
      .default(3)
      .describe('Max retry attempts for failed tasks'),

    // Timeouts
    AGENT_TIMEOUT_MS: z.coerce
      .number()
      .min(1000)
      .max(600000)
      .default(120000)
      .describe('Agent task timeout in milliseconds'),
    REQUEST_TIMEOUT_MS: z.coerce
      .number()
      .min(1000)
      .max(600000)
      .default(150000)
      .describe('HTTP request timeout in milliseconds'),

    // Observability
    ENABLE_REQUEST_LOGGING: z.coerce.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    // Either FIREBASE_CREDENTIALS_PATH or FIREBASE_CREDENTIALS_JSON must be provided
    if (!data.FIREBASE_CREDENTIALS_PATH && !data.FIREBASE_CREDENTIALS_JSON) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Either FIREBASE_CREDENTIALS_PATH or FIREBASE_CREDENTIALS_JSON must be set',
        path: ['FIREBASE_CREDENTIALS_PATH'],
      });
    }

    // In production, TLS should be enabled for Redis
    if (data.NODE_ENV === 'production' && !data.REDIS_TLS) {
      console.warn(
        '⚠️  WARNING: Redis TLS is disabled in production environment'
      );
    }
  });

/**
 * Validated environment variables
 */
export type Environment = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 */
function parseEnvironment(): Environment {
  try {
    const parsed = envSchema.parse(process.env);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.errors
        .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
        .join('\n');

      throw new ConfigurationError(
        `Environment validation failed:\n${issues}`,
        {
          errors: error.errors,
        }
      );
    }
    throw error;
  }
}

/**
 * Validated and typed environment configuration
 */
export const env = parseEnvironment();

/**
 * Helper to check if running in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Helper to check if running in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Helper to check if running in test
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * Log environment configuration (redact sensitive values)
 */
export function logEnvironmentConfig(): void {
  console.log('📝 Environment Configuration:');
  console.log(`  NODE_ENV: ${env.NODE_ENV}`);
  console.log(`  PORT: ${env.PORT}`);
  console.log(`  LOG_LEVEL: ${env.LOG_LEVEL}`);
  console.log(`  FIREBASE_PROJECT_ID: ${env.FIREBASE_PROJECT_ID}`);
  console.log(
    `  FIREBASE_CREDENTIALS: ${env.FIREBASE_CREDENTIALS_PATH ? 'file' : 'json'}`
  );
  console.log(`  ANTHROPIC_API_KEY: ${env.ANTHROPIC_API_KEY.substring(0, 12)}...`);
  console.log(`  REDIS_HOST: ${env.REDIS_HOST}:${env.REDIS_PORT}`);
  console.log(`  REDIS_TLS: ${env.REDIS_TLS}`);
  console.log(`  QUEUE_CONCURRENCY: ${env.QUEUE_CONCURRENCY}`);
  console.log(`  AGENT_TIMEOUT_MS: ${env.AGENT_TIMEOUT_MS}ms`);
  console.log('');
}
