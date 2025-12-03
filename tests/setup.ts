/**
 * Test Setup
 *
 * Global setup for all tests.
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Set default test environment variables
process.env.PORT = '3003';
process.env.LOG_LEVEL = 'error'; // Minimal logging during tests
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_CREDENTIALS_JSON = JSON.stringify({
  type: 'service_account',
  project_id: 'test-project',
  private_key_id: 'test-key-id',
  private_key: '-----BEGIN PRIVATE KEY-----\ntest-private-key\n-----END PRIVATE KEY-----',
  client_email: 'test@test-project.iam.gserviceaccount.com',
  client_id: 'test-client-id',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/test%40test-project.iam.gserviceaccount.com',
});
process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-123';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.AGENT_TIMEOUT_MS = '30000';
process.env.REQUEST_TIMEOUT_MS = '45000';
process.env.QUEUE_CONCURRENCY = '1';
process.env.QUEUE_MAX_RETRIES = '2';

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging test failures
  error: console.error,
};

// Global test timeout
jest.setTimeout(30000);
