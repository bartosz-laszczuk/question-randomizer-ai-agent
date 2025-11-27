/**
 * Custom Error Classes
 *
 * Provides specific error types for better error handling and logging.
 */

/**
 * Base application error
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Validation error (400)
 * Used when request validation fails
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Not found error (404)
 * Used when a resource is not found
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with ID '${id}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * Unauthorized error (401)
 * Used when authentication fails
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Forbidden error (403)
 * Used when user doesn't have permission
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * Agent execution error
 * Used when agent task execution fails
 */
export class AgentExecutionError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 500, 'AGENT_EXECUTION_ERROR', details);
  }
}

/**
 * Firestore error
 * Used when Firestore operations fail
 */
export class FirestoreError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 500, 'FIRESTORE_ERROR', details);
  }
}

/**
 * Configuration error
 * Used when environment configuration is invalid
 */
export class ConfigurationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 500, 'CONFIGURATION_ERROR', details);
  }
}

/**
 * Timeout error
 * Used when operations exceed time limits
 */
export class TimeoutError extends AppError {
  constructor(message: string = 'Operation timed out') {
    super(message, 408, 'TIMEOUT_ERROR');
  }
}
