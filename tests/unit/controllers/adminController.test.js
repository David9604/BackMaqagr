import { jest, describe, test, expect, beforeEach } from '@jest/globals';

const mockRedisGet = jest.fn();
const mockRedisSet = jest.fn();

const mockUserCountByStatus = jest.fn();
const mockUserCount = jest.fn();
const mockUserCountByMonth = jest.fn();
const mockTractorCount = jest.fn();
const mockImplementCount = jest.fn();
const mockTerrainCount = jest.fn();
const mockQueryCount = jest.fn();
const mockQueryTrendByBucket = jest.fn();
const mockQueryCountByUser = jest.fn();
const mockRecommendationCount = jest.fn();
const mockRecommendationTopTractors = jest.fn();
const mockRecommendationTopImplements = jest.fn();
const mockRecommendationTerrainDistribution = jest.fn();
const mockRecommendationPowerRangeDistribution = jest.fn();
const mockRecommendationAverageRecommendedPower = jest.fn();

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
    countByStatus: mockUserCountByStatus,
    count: mockUserCount,
    countByMonth: mockUserCountByMonth,
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
    trendByBucket: mockQueryTrendByBucket,
    countByUser: mockQueryCountByUser,
  },
  AnalyticsRecommendation: {
    count: mockRecommendationCount,
    topTractors: mockRecommendationTopTractors,
    topImplements: mockRecommendationTopImplements,
    terrainDistribution: mockRecommendationTerrainDistribution,
    powerRangeDistribution: mockRecommendationPowerRangeDistribution,
    averageRecommendedPower: mockRecommendationAverageRecommendedPower,
  },
}));

const {
  getOverviewStats,
  getRecommendationStats,
  getUserStats,
} = await import('../../../src/controllers/adminController.js');

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

      mockUserCountByStatus.mockResolvedValue([
        { status: 'active', value: 2 },
        { status: 'inactive', value: 1 },
      ]);
      mockTractorCount.mockResolvedValue(3);
      mockImplementCount.mockResolvedValue(3);
      mockTerrainCount.mockResolvedValue(2);
      mockQueryCount.mockResolvedValue(4);
      mockRecommendationCount.mockResolvedValue(5);
      mockQueryTrendByBucket
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
      expect(mockUserCountByStatus).not.toHaveBeenCalled();
      expect(mockTractorCount).not.toHaveBeenCalled();
      expect(mockQueryTrendByBucket).not.toHaveBeenCalled();
      expect(mockRedisSet).not.toHaveBeenCalled();
    });
  });

  describe('getRecommendationStats()', () => {
    test('retorna rankings, distribuciones y promedio de potencia recomendado', async () => {
      const req = {};
      const res = createMockRes();
      const next = jest.fn();

      mockRecommendationTopTractors.mockResolvedValue([
        { tractor_id: 1, name: '6130M', brand: 'John Deere', model: '6130M', value: 4 },
        { tractor_id: 2, name: 'Puma', brand: 'Case', model: 'Puma', value: 2 },
      ]);
      mockRecommendationTopImplements.mockResolvedValue([
        { implement_id: 7, name: 'Sembradora', brand: 'Agro', implement_type: 'seeder', value: 3 },
      ]);
      mockRecommendationTerrainDistribution.mockResolvedValue([
        { label: 'loam', value: 5 },
        { label: 'clay', value: 2 },
      ]);
      mockRecommendationPowerRangeDistribution.mockResolvedValue([
        { label: '60-99 HP', bucket_order: 2, value: 2 },
        { label: '100-149 HP', bucket_order: 3, value: 5 },
      ]);
      mockRecommendationAverageRecommendedPower.mockResolvedValue({
        average_power_hp: 123.456,
      });

      await callHandler(getRecommendationStats, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: {
            topTractors: {
              labels: ['John Deere 6130M', 'Case Puma'],
              series: [4, 2],
              data: [
                {
                  id: 1,
                  name: '6130M',
                  brand: 'John Deere',
                  model: '6130M',
                  value: 4,
                  label: 'John Deere 6130M',
                },
                {
                  id: 2,
                  name: 'Puma',
                  brand: 'Case',
                  model: 'Puma',
                  value: 2,
                  label: 'Case Puma',
                },
              ],
            },
            topImplements: {
              labels: ['Agro Sembradora'],
              series: [3],
              data: [
                {
                  id: 7,
                  name: 'Sembradora',
                  brand: 'Agro',
                  type: 'seeder',
                  value: 3,
                  label: 'Agro Sembradora',
                },
              ],
            },
            terrainDistribution: {
              labels: ['loam', 'clay'],
              series: [5, 2],
              data: [
                { label: 'loam', value: 5 },
                { label: 'clay', value: 2 },
              ],
            },
            powerRangeDistribution: {
              labels: ['60-99 HP', '100-149 HP'],
              series: [2, 5],
              data: [
                { label: '60-99 HP', value: 2 },
                { label: '100-149 HP', value: 5 },
              ],
            },
            averageRecommendedPowerHp: 123.46,
            generatedAt: expect.any(String),
          },
        }),
      );
    });
  });

  describe('getUserStats()', () => {
    test('retorna estadísticas agregadas de usuarios y promedios', async () => {
      const req = {};
      const res = createMockRes();
      const next = jest.fn();

      mockUserCountByMonth.mockResolvedValue([
        { label: '2026-01', value: '2' },
        { label: '2026-02', value: '1' },
      ]);
      mockUserCount.mockResolvedValue(4);
      mockTerrainCount.mockResolvedValue(10);
      mockQueryCount.mockResolvedValue(12);
      mockQueryCountByUser.mockResolvedValue([
        { user_id: 1, value: '4' },
        { user_id: 2, value: '3' },
        { user_id: 3, value: '1' },
      ]);

      await callHandler(getUserStats, req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Estadísticas de usuarios obtenidas exitosamente',
        data: {
          usersRegisteredByMonth: {
            labels: ['2026-01', '2026-02'],
            series: [2, 1],
            data: [
              { label: '2026-01', value: 2 },
              { label: '2026-02', value: 1 },
            ],
          },
          users: {
            total: 4,
            active: 3,
            inactive: 1,
          },
          averages: {
            terrainsPerUser: 2.5,
            queriesPerUser: 3,
          },
          generatedAt: expect.any(String),
        },
      });
    });

    test('retorna promedios en cero cuando no hay usuarios', async () => {
      const req = {};
      const res = createMockRes();

      mockUserCountByMonth.mockResolvedValue([]);
      mockUserCount.mockResolvedValue(0);
      mockTerrainCount.mockResolvedValue(5);
      mockQueryCount.mockResolvedValue(9);
      mockQueryCountByUser.mockResolvedValue([]);

      await callHandler(getUserStats, req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            users: {
              total: 0,
              active: 0,
              inactive: 0,
            },
            averages: {
              terrainsPerUser: 0,
              queriesPerUser: 0,
            },
          }),
        }),
      );
    });
  });
});