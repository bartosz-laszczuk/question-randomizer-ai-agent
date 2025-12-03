/**
 * Mock Helpers
 *
 * Helpers for mocking external services in tests.
 */

import type Anthropic from '@anthropic-ai/sdk';

/**
 * Mock Firestore document snapshot
 */
export function mockFirestoreDocumentSnapshot(data: unknown, exists = true) {
  return {
    exists,
    id: 'test-doc-id',
    data: () => (exists ? data : undefined),
    get: (field: string) => (data as Record<string, unknown>)[field],
    ref: {
      id: 'test-doc-id',
      path: 'collection/test-doc-id',
    },
  };
}

/**
 * Mock Firestore query snapshot
 */
export function mockFirestoreQuerySnapshot(docs: unknown[]) {
  return {
    empty: docs.length === 0,
    size: docs.length,
    docs: docs.map((data, index) => ({
      exists: true,
      id: `doc-${index}`,
      data: () => data,
      get: (field: string) => (data as Record<string, unknown>)[field],
      ref: {
        id: `doc-${index}`,
        path: `collection/doc-${index}`,
      },
    })),
    forEach: (callback: (doc: unknown) => void) => {
      docs.forEach((data, index) =>
        callback({
          exists: true,
          id: `doc-${index}`,
          data: () => data,
        })
      );
    },
  };
}

/**
 * Mock Firestore collection reference
 */
export function mockFirestoreCollection() {
  const whereMock = jest.fn().mockReturnThis();
  const orderByMock = jest.fn().mockReturnThis();
  const limitMock = jest.fn().mockReturnThis();
  const offsetMock = jest.fn().mockReturnThis();
  const getMock = jest.fn();
  const docMock = jest.fn();
  const addMock = jest.fn();

  return {
    where: whereMock,
    orderBy: orderByMock,
    limit: limitMock,
    offset: offsetMock,
    get: getMock,
    doc: docMock,
    add: addMock,
    _mocks: {
      where: whereMock,
      orderBy: orderByMock,
      limit: limitMock,
      offset: offsetMock,
      get: getMock,
      doc: docMock,
      add: addMock,
    },
  };
}

/**
 * Mock Firestore document reference
 */
export function mockFirestoreDocument() {
  const getMock = jest.fn();
  const setMock = jest.fn();
  const updateMock = jest.fn();
  const deleteMock = jest.fn();

  return {
    id: 'test-doc-id',
    path: 'collection/test-doc-id',
    get: getMock,
    set: setMock,
    update: updateMock,
    delete: deleteMock,
    _mocks: {
      get: getMock,
      set: setMock,
      update: updateMock,
      delete: deleteMock,
    },
  };
}

/**
 * Mock Claude API response
 */
export function mockClaudeResponse(
  content: Array<Anthropic.TextBlock | Anthropic.ToolUseBlock>,
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens' = 'end_turn'
): Anthropic.Message {
  return {
    id: 'msg_test_123',
    type: 'message',
    role: 'assistant',
    content,
    model: 'claude-sonnet-4-5-20250929',
    stop_reason: stopReason,
    stop_sequence: null,
    usage: {
      input_tokens: 100,
      output_tokens: 50,
    },
  };
}

/**
 * Mock Claude text response
 */
export function mockClaudeTextResponse(text: string): Anthropic.Message {
  return mockClaudeResponse([
    {
      type: 'text',
      text,
    },
  ]);
}

/**
 * Mock Claude tool use response
 */
export function mockClaudeToolUseResponse(
  toolName: string,
  input: Record<string, unknown>
): Anthropic.Message {
  return mockClaudeResponse(
    [
      {
        type: 'tool_use',
        id: 'toolu_test_123',
        name: toolName,
        input,
      },
    ],
    'tool_use'
  );
}

/**
 * Mock Anthropic client
 */
export function mockAnthropicClient() {
  const createMock = jest.fn();

  return {
    messages: {
      create: createMock,
    },
    _mocks: {
      create: createMock,
    },
  };
}

/**
 * Mock Redis client
 */
export function mockRedisClient() {
  const pingMock = jest.fn().mockResolvedValue('PONG');
  const getMock = jest.fn();
  const setMock = jest.fn();
  const delMock = jest.fn();
  const quitMock = jest.fn();
  const disconnectMock = jest.fn();
  const onMock = jest.fn();

  return {
    ping: pingMock,
    get: getMock,
    set: setMock,
    del: delMock,
    quit: quitMock,
    disconnect: disconnectMock,
    on: onMock,
    _mocks: {
      ping: pingMock,
      get: getMock,
      set: setMock,
      del: delMock,
      quit: quitMock,
      disconnect: disconnectMock,
      on: onMock,
    },
  };
}

/**
 * Mock Express request
 */
export function mockRequest(overrides: Record<string, unknown> = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides,
  };
}

/**
 * Mock Express response
 */
export function mockResponse() {
  const jsonMock = jest.fn();
  const statusMock = jest.fn().mockReturnValue({
    json: jsonMock,
  });
  const sendMock = jest.fn();
  const setHeaderMock = jest.fn();
  const writeMock = jest.fn();
  const endMock = jest.fn();
  const onMock = jest.fn();

  return {
    status: statusMock,
    json: jsonMock,
    send: sendMock,
    setHeader: setHeaderMock,
    write: writeMock,
    end: endMock,
    on: onMock,
    _mocks: {
      status: statusMock,
      json: jsonMock,
      send: sendMock,
      setHeader: setHeaderMock,
      write: writeMock,
      end: endMock,
      on: onMock,
    },
  };
}
