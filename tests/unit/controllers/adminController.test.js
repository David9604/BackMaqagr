import { jest, describe, test, expect, beforeEach } from '@jest/globals';

const mockRedisGet = jest.fn();
const mockRedisSet = jest.fn();

const mockUserFindAll = jest.fn();
const mockTractorCount = jest.fn();
const mockImplementCount = jest.fn();
const mockTerrainCount = jest.fn();
const mockQueryCount = jest.fn();
const mockQueryFindAll = jest.fn();
const mockRecommendationCount = jest.fn();

jest.unstable_mockModule('../../../src/config/redis.js', () => ({
  __esModule: true,
  default: {
    status: 'ready',
    get: mockRedisGet,
    set: mockRedisSet,
  },
}));

jest.unstable_mockModule('../../../src/models/adminAnalytics.models.js', () => ({
  __esModule: true,
  AnalyticsUser: {
    findAll: mockUserFindAll,
  },
  AnalyticsTractor: {
    count: mockTractorCount,
  },
  AnalyticsImplement: {
    count: mockImplementCount,
  },
  AnalyticsTerrain: {
    count: mockTerrainCount,
  },
  AnalyticsQuery: {
    count: mockQueryCount,
    findAll: mockQueryFindAll,
  },
  AnalyticsRecommendation: {
    count: mockRecommendationCount,
  },
}));

const { getOverviewStats } = await import('../../../src/controllers/adminController.js');

const createMockRes = () => {
  const res = {};
  res.setHeader = jest.fn();
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const callHandler = async (handler, req, res, next) => {
  handler(req, res, next);
  await new Promise((resolve) => setImmediate(resolve));
};

describe('adminController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOverviewStats()', () => {
    test('cachea la respuesta del overview con TTL de una hora', async () => {
      const req = {};
      const res = createMockRes();
      const next = jest.fn();

      mockRedisGet.mockResolvedValue(null);
      mockRedisSet.mockResolvedValue('OK');

      mockUserFindAll.mockResolvedValue([
        { status: 'active', value: '2' },
        { status: 'inactive', value: '1' },
      ]);
      mockTractorCount.mockResolvedValue(3);
      mockImplementCount.mockResolvedValue(3);
      mockTerrainCount.mockResolvedValue(2);
      mockQueryCount.mockResolvedValue(4);
      mockRecommendationCount.mockResolvedValue(5);
      mockQueryFindAll
        .mockResolvedValueOnce([{ label: '2026-03-01', value: '2' }])
        .mockResolvedValueOnce([{ label: '2026-09', value: '3' }])
        .mockResolvedValueOnce([{ label: '2026-03', value: '4' }]);

      await callHandler(getOverviewStats, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totals: expect.objectContaining({
              users: { total: 3, active: 2, inactive: 1 },
              tractors: 3,
              implements: 3,
              terrains: 2,
              queries: 4,
              recommendations: 5,
            }),
            queriesTrend: expect.objectContaining({
              byDay: expect.objectContaining({
                labels: expect.any(Array),
                series: expect.any(Array),
              }),
            }),
            cacheTTLSeconds: 3600,
          }),
        }),
      );

      const responseBody = res.json.mock.calls[0][0];
      expect(responseBody.data.queriesTrend.byDay.labels).toHaveLength(30);
      expect(responseBody.data.queriesTrend.byDay.series).toHaveLength(30);
      expect(mockRedisSet).toHaveBeenCalledWith(
        'cache:admin:stats:overview:v1',
        JSON.stringify(responseBody),
        'EX',
        3600,
      );
    });

    test('retorna la respuesta cacheada sin consultar analytics', async () => {
      const cachedPayload = {
        success: true,
        message: 'cached',
        data: {
          totals: {
            users: { total: 10, active: 7, inactive: 3 },
          },
        },
      };

      const req = {};
      const res = createMockRes();
      const next = jest.fn();

      mockRedisGet.mockResolvedValue(JSON.stringify(cachedPayload));

      await callHandler(getOverviewStats, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(cachedPayload);
      expect(mockUserFindAll).not.toHaveBeenCalled();
      expect(mockTractorCount).not.toHaveBeenCalled();
      expect(mockQueryFindAll).not.toHaveBeenCalled();
      expect(mockRedisSet).not.toHaveBeenCalled();
    });
  });
});
