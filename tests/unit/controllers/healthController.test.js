/**
 * Tests unitarios para healthController.js (DDAAM-112)
 */

import { jest, describe, test, expect, afterEach } from '@jest/globals';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockPoolQuery = jest.fn();
const mockRedisPing = jest.fn();

jest.unstable_mockModule('../../../src/config/db.js', () => ({
  pool: { query: mockPoolQuery },
}));

jest.unstable_mockModule('../../../src/config/logger.js', () => ({
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    http: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../src/config/redis.js', () => ({
  default: {
    ping: mockRedisPing,
  },
}));

// Importar módulo bajo test DESPUÉS de registrar los mocks
const { getHealth, getHealthDetailed } =
  await import('../../../src/controllers/healthController.js');

// ── Helpers ────────────────────────────────────────────────────────────────

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const makeReq = (overrides = {}) => ({
  requestId: 'test-req-id',
  user: { user_id: 1, role_id: 1 },
  ...overrides,
});

const runHandler = async (handler, req, res) => {
  const next = jest.fn();
  handler(req, res, next);
  await new Promise((resolve) => setImmediate(resolve));
  return next;
};

// ── GET /health ────────────────────────────────────────────────────────────

describe('getHealth', () => {
  test('responds 200 with status, uptime and timestamp', async () => {
    const req = makeReq();
    const res = makeRes();

    await runHandler(getHealth, req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.status).toBe('ok');
    expect(typeof body.uptime).toBe('number');
    expect(body.uptime).toBeGreaterThanOrEqual(0);
    expect(typeof body.timestamp).toBe('string');
    // Verify ISO 8601 format
    expect(() => new Date(body.timestamp)).not.toThrow();
  });
});

// ── GET /health/detailed ───────────────────────────────────────────────────

describe('getHealthDetailed', () => {
  afterEach(() => jest.clearAllMocks());

  test('responds 200 when database is reachable', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });
    mockRedisPing.mockResolvedValueOnce('PONG');

    const req = makeReq();
    const res = makeRes();

    await runHandler(getHealthDetailed, req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.status).toBe('ok');
    expect(body.services.database.status).toBe('connected');
    expect(typeof body.services.database.latencyMs).toBe('number');
  });

  test('responds 503 with degraded status when database is unreachable', async () => {
    mockPoolQuery.mockRejectedValueOnce(new Error('Connection refused'));
    mockRedisPing.mockResolvedValueOnce('PONG');

    const req = makeReq();
    const res = makeRes();

    await runHandler(getHealthDetailed, req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    const body = res.json.mock.calls[0][0];
    expect(body.status).toBe('degraded');
    expect(body.services.database.status).toBe('disconnected');
    expect(body.services.database.error).toBe('Connection refused');
  });

  test('always includes system metrics', async () => {
    mockPoolQuery.mockResolvedValueOnce({});
    mockRedisPing.mockResolvedValueOnce('PONG');

    const req = makeReq();
    const res = makeRes();

    await runHandler(getHealthDetailed, req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.system).toBeDefined();
    expect(body.system.memory).toBeDefined();
    expect(body.system.cpuUsage).toBeDefined();
    expect(body.system.nodeVersion).toMatch(/^v\d+\.\d+\.\d+/);
  });

  test('marks redis as disconnected and includes error when ping fails', async () => {
    mockPoolQuery.mockResolvedValueOnce({});
    mockRedisPing.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const req = makeReq();
    const res = makeRes();

    await runHandler(getHealthDetailed, req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.services.redis.status).toBe('disconnected');
    expect(body.services.redis.latency_ms).toBeNull();
    expect(body.services.redis.error).toBe('ECONNREFUSED');
  });

  test('marks redis as connected and reports latency when ping succeeds', async () => {
    mockPoolQuery.mockResolvedValueOnce({});
    mockRedisPing.mockResolvedValueOnce('PONG');

    const req = makeReq();
    const res = makeRes();

    await runHandler(getHealthDetailed, req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.services.redis.status).toBe('connected');
    expect(typeof body.services.redis.latency_ms).toBe('number');
    expect(body.services.redis.latency_ms).toBeGreaterThanOrEqual(0);
  });
});
