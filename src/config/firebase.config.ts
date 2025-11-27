/**
 * Firebase Admin SDK Configuration
 *
 * Initializes Firebase Admin SDK and provides Firestore instance.
 * Supports both credential file path and JSON string for flexibility.
 */

import admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { env } from './environment.js';
import { ConfigurationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Firestore collection names
 * Centralized for consistency with C# Backend
 */
export const COLLECTIONS = {
  USERS: 'users',
  QUESTIONS: 'questions',
  CATEGORIES: 'categories',
  QUALIFICATIONS: 'qualifications',
  RANDOMIZATIONS: 'randomizations',
  SELECTED_CATEGORIES: 'selectedCategories',
  USED_QUESTIONS: 'usedQuestions',
  POSTPONED_QUESTIONS: 'postponedQuestions',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  AGENT_TASKS: 'agent_tasks', // For task status tracking
} as const;

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase(): admin.app.App {
  try {
    // If already initialized (e.g., in tests), return existing app
    if (admin.apps.length > 0) {
      logger.debug('Firebase already initialized, using existing app');
      return admin.apps[0]!;
    }

    // Load credentials from file or JSON string
    let credential: admin.ServiceAccount;

    if (env.FIREBASE_CREDENTIALS_PATH) {
      // Load from file (development)
      logger.info(
        `Loading Firebase credentials from file: ${env.FIREBASE_CREDENTIALS_PATH}`
      );
      const credentialsFile = readFileSync(
        env.FIREBASE_CREDENTIALS_PATH,
        'utf-8'
      );
      credential = JSON.parse(credentialsFile);
    } else if (env.FIREBASE_CREDENTIALS_JSON) {
      // Load from environment variable (production)
      logger.info('Loading Firebase credentials from environment variable');
      credential = JSON.parse(env.FIREBASE_CREDENTIALS_JSON);
    } else {
      throw new ConfigurationError(
        'Firebase credentials not configured. Set either FIREBASE_CREDENTIALS_PATH or FIREBASE_CREDENTIALS_JSON'
      );
    }

    // Initialize Firebase Admin SDK
    const app = admin.initializeApp({
      credential: admin.credential.cert(credential),
      projectId: env.FIREBASE_PROJECT_ID,
    });

    logger.info(
      `✅ Firebase Admin SDK initialized for project: ${env.FIREBASE_PROJECT_ID}`
    );

    return app;
  } catch (error) {
    logger.error({ err: error }, 'Failed to initialize Firebase Admin SDK');

    if (error instanceof SyntaxError) {
      throw new ConfigurationError(
        'Invalid Firebase credentials JSON format',
        { originalError: (error as Error).message }
      );
    }

    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new ConfigurationError(
        `Firebase credentials file not found: ${env.FIREBASE_CREDENTIALS_PATH}`,
        { originalError: error.message }
      );
    }

    throw error;
  }
}

/**
 * Firebase Admin App instance
 */
export const firebaseApp = initializeFirebase();

/**
 * Firestore Database instance
 *
 * Use this for all Firestore operations throughout the application.
 */
export const db: Firestore = admin.firestore();

/**
 * Firestore settings configuration
 */
db.settings({
  ignoreUndefinedProperties: true, // Ignore undefined properties in documents
});

/**
 * Helper to verify Firestore connection
 */
export async function verifyFirestoreConnection(): Promise<boolean> {
  try {
    // Try to read from a test collection
    await db.collection('_health_check').limit(1).get();
    logger.debug('Firestore connection verified');
    return true;
  } catch (error) {
    logger.error({ err: error }, 'Firestore connection failed');
    return false;
  }
}

/**
 * Type helper for Firestore timestamps
 */
export type FirestoreTimestamp = admin.firestore.Timestamp;

/**
 * Helper to create Firestore timestamp
 */
export const timestamp = admin.firestore.Timestamp;

/**
 * Helper to get server timestamp (for writes)
 */
export const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;
