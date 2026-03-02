/**
 * Tests unitarios para healthController.js (DDAAM-112)
 */

import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockPoolQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/db.js', () => ({
  pool: { query: mockPoolQuery },
}));

jest.unstable_mockModule('../../../src/config/logger.js', () => ({
  default: {
    error: jest.fn(),
    warn:  jest.fn(),
    info:  jest.fn(),
    http:  jest.fn(),
  },
}));

// Importar módulo bajo test DESPUÉS de registrar los mocks
const { getHealth, getHealthDetailed } =
  await import('../../../src/controllers/healthController.js');

// ── Helpers ────────────────────────────────────────────────────────────────

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const makeReq = (overrides = {}) => ({
  requestId: 'test-req-id',
  user: { user_id: 1, role_id: 1 },
  ...overrides,
});

// ── GET /health ────────────────────────────────────────────────────────────

describe('getHealth', () => {
  test('responds 200 with status, uptime and timestamp', async () => {
    const req = makeReq();
    const res = makeRes();

    await getHealth(req, res);

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

    const req = makeReq();
    const res = makeRes();

    await getHealthDetailed(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.status).toBe('ok');
    expect(body.services.database.status).toBe('connected');
    expect(typeof body.services.database.latencyMs).toBe('number');
  });

  test('responds 503 with degraded status when database is unreachable', async () => {
    mockPoolQuery.mockRejectedValueOnce(new Error('Connection refused'));

    const req = makeReq();
    const res = makeRes();

    await getHealthDetailed(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    const body = res.json.mock.calls[0][0];
    expect(body.status).toBe('degraded');
    expect(body.services.database.status).toBe('disconnected');
    expect(body.services.database.error).toBe('Connection refused');
  });

  test('always includes system metrics', async () => {
    mockPoolQuery.mockResolvedValueOnce({});

    const req = makeReq();
    const res = makeRes();

    await getHealthDetailed(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.system).toBeDefined();
    expect(body.system.memory).toBeDefined();
    expect(body.system.cpuUsage).toBeDefined();
    expect(body.system.nodeVersion).toMatch(/^v\d+\.\d+\.\d+/);
  });

  test('marks redis as disconnected (not yet configured)', async () => {
    mockPoolQuery.mockResolvedValueOnce({});

    const req = makeReq();
    const res = makeRes();

    await getHealthDetailed(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.services.redis.status).toBe('disconnected');
  });
});
