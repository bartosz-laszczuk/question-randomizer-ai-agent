/**
 * SSE Manager
 *
 * Manages Server-Sent Events (SSE) connections for streaming agent progress.
 */

import { Response } from 'express';
import logger from '../../utils/logger.js';

/**
 * SSE Event types
 */
export enum SSEEventType {
  PROGRESS = 'progress',
  TOOL_USE = 'tool_use',
  THINKING = 'thinking',
  COMPLETE = 'complete',
  ERROR = 'error',
  PING = 'ping',
}

/**
 * SSE Event data
 */
export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
  timestamp?: string;
}

/**
 * SSE Manager Class
 *
 * Handles Server-Sent Events streaming to HTTP clients.
 */
export class SSEManager {
  private response: Response;
  private clientId: string;
  private isClosed: boolean = false;
  private pingInterval?: NodeJS.Timeout;

  constructor(response: Response, clientId: string) {
    this.response = response;
    this.clientId = clientId;

    this.setupSSE();
  }

  /**
   * Setup SSE headers and connection
   */
  private setupSSE(): void {
    // Set SSE headers
    this.response.setHeader('Content-Type', 'text/event-stream');
    this.response.setHeader('Cache-Control', 'no-cache');
    this.response.setHeader('Connection', 'keep-alive');
    this.response.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Handle client disconnect
    this.response.on('close', () => {
      this.handleDisconnect();
    });

    // Start ping interval to keep connection alive
    this.startPingInterval();

    logger.debug({ clientId: this.clientId }, 'SSE connection established');
  }

  /**
   * Send an event to the client
   */
  sendEvent(event: SSEEvent): void {
    if (this.isClosed) {
      logger.warn(
        { clientId: this.clientId },
        'Attempted to send event on closed SSE connection'
      );
      return;
    }

    try {
      // Add timestamp if not present
      const eventWithTimestamp = {
        ...event,
        timestamp: event.timestamp || new Date().toISOString(),
      };

      // Format SSE message
      const message = this.formatSSEMessage(
        event.type,
        JSON.stringify(eventWithTimestamp.data)
      );

      // Write to response
      this.response.write(message);

      logger.debug(
        { clientId: this.clientId, eventType: event.type },
        'SSE event sent'
      );
    } catch (error) {
      logger.error(
        { err: error, clientId: this.clientId },
        'Failed to send SSE event'
      );
    }
  }

  /**
   * Send progress event
   */
  sendProgress(message: string, progress?: number): void {
    this.sendEvent({
      type: SSEEventType.PROGRESS,
      data: {
        message,
        progress,
      },
    });
  }

  /**
   * Send tool use event
   */
  sendToolUse(toolName: string, input: unknown, output?: string): void {
    this.sendEvent({
      type: SSEEventType.TOOL_USE,
      data: {
        toolName,
        input,
        output,
      },
    });
  }

  /**
   * Send thinking event
   */
  sendThinking(content: string): void {
    this.sendEvent({
      type: SSEEventType.THINKING,
      data: {
        content,
      },
    });
  }

  /**
   * Send completion event
   */
  sendComplete(result: unknown): void {
    this.sendEvent({
      type: SSEEventType.COMPLETE,
      data: result,
    });
  }

  /**
   * Send error event
   */
  sendError(message: string, code?: string): void {
    this.sendEvent({
      type: SSEEventType.ERROR,
      data: {
        message,
        code,
      },
    });
  }

  /**
   * Close the SSE connection
   */
  close(): void {
    if (this.isClosed) {
      return;
    }

    this.isClosed = true;

    // Stop ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    // End the response
    this.response.end();

    logger.debug({ clientId: this.clientId }, 'SSE connection closed');
  }

  /**
   * Check if connection is closed
   */
  get closed(): boolean {
    return this.isClosed;
  }

  /**
   * Format SSE message
   */
  private formatSSEMessage(event: string, data: string): string {
    return `event: ${event}\ndata: ${data}\n\n`;
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    // Send ping every 15 seconds
    this.pingInterval = setInterval(() => {
      if (!this.isClosed) {
        this.sendEvent({
          type: SSEEventType.PING,
          data: { alive: true },
        });
      }
    }, 15000);
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(): void {
    if (this.isClosed) {
      return;
    }

    logger.info({ clientId: this.clientId }, 'SSE client disconnected');

    this.isClosed = true;

    // Stop ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
  }
}

/**
 * Create a new SSE manager instance
 */
export function createSSEManager(
  response: Response,
  clientId: string
): SSEManager {
  return new SSEManager(response, clientId);
}
