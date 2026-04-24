import redisClient from '../config/redis.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import {
  AnalyticsUser,
  AnalyticsTractor,
  AnalyticsImplement,
  AnalyticsTerrain,
  AnalyticsQuery,
  AnalyticsRecommendation,
} from '../models/adminAnalytics.models.js';

const OVERVIEW_CACHE_KEY = 'cache:admin:stats:overview:v1';
const OVERVIEW_CACHE_TTL_SECONDS = 3600; // 1 hora

const toInteger = (value) => parseInt(value, 10) || 0;
const toFloat = (value) => Number.parseFloat(value) || 0;
const canUseRedisCache = () => redisClient && redisClient.status === 'ready';
const roundToTwoDecimals = (value) => Number(toFloat(value).toFixed(2));

const toChartData = (rows) => ({
  labels: rows.map((row) => row.label),
  series: rows.map((row) => toFloat(row.value)),
  data: rows.map((row) => ({
    label: row.label,
    value: toFloat(row.value),
  })),
});

const getLast30DaysStart = () => {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - 29);
  return start;
};

const fillDailySeries = (rows) => {
  const indexedRows = new Map(
    rows.map((row) => [row.label, toFloat(row.value)]),
  );
  const data = [];
  const cursor = getLast30DaysStart();

  for (let index = 0; index < 30; index += 1) {
    const label = cursor.toISOString().slice(0, 10);
    data.push({
      label,
      value: indexedRows.get(label) || 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return toChartData(data);
};

const getOverviewCache = async () => {
  if (!canUseRedisCache()) {
    return null;
  }

  try {
    const cached = await redisClient.get(OVERVIEW_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const setOverviewCache = async (payload) => {
  if (!canUseRedisCache()) {
    return;
  }

  try {
    await redisClient.set(
      OVERVIEW_CACHE_KEY,
      JSON.stringify(payload),
      'EX',
      OVERVIEW_CACHE_TTL_SECONDS,
    );
  } catch {
    // Si Redis falla, no bloqueamos respuesta.
  }
};

export const getOverviewStats = asyncHandler(async (req, res) => {
  const cachedResponse = await getOverviewCache();
  if (cachedResponse) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cachedResponse);
  }

  const since = getLast30DaysStart();

  const [
    usersByStatus,
    totalTractors,
    totalImplements,
    totalTerrains,
    totalQueries,
    totalRecommendations,
    byDayRows,
    byWeekRows,
    byMonthRows,
  ] = await Promise.all([
    AnalyticsUser.countByStatus(),
    AnalyticsTractor.count(),
    AnalyticsImplement.count(),
    AnalyticsTerrain.count(),
    AnalyticsQuery.count(),
    AnalyticsRecommendation.count(),
    AnalyticsQuery.trendByBucket("DATE_TRUNC('day', query_date)", 'YYYY-MM-DD', since),
    AnalyticsQuery.trendByBucket("DATE_TRUNC('week', query_date)", 'IYYY-IW', since),
    AnalyticsQuery.trendByBucket("DATE_TRUNC('month', query_date)", 'YYYY-MM', since),
  ]);

  const activeUsers = usersByStatus.reduce(
    (total, row) => total + (row.status === 'active' ? toInteger(row.value) : 0),
    0,
  );
  const totalUsers = usersByStatus.reduce(
    (total, row) => total + toInteger(row.value),
    0,
  );

  const response = {
    success: true,
    message: 'Estadísticas generales obtenidas exitosamente',
    data: {
      totals: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
        },
        tractors: totalTractors,
        implements: totalImplements,
        terrains: totalTerrains,
        queries: totalQueries,
        recommendations: totalRecommendations,
      },
      queriesTrend: {
        byDay: fillDailySeries(byDayRows),
        byWeek: toChartData(byWeekRows),
        byMonth: toChartData(byMonthRows),
      },
      cacheTTLSeconds: OVERVIEW_CACHE_TTL_SECONDS,
      generatedAt: new Date().toISOString(),
    },
  };

  res.setHeader('X-Cache', 'MISS');
  await setOverviewCache(response);
  return res.status(200).json(response);
});

export const getRecommendationStats = asyncHandler(async (req, res) => {
  const [
    topTractorsRows,
    topImplementsRows,
    terrainDistributionRows,
    powerRangeDistributionRows,
    averagePowerRow,
  ] = await Promise.all([
    AnalyticsRecommendation.topTractors(10),
    AnalyticsRecommendation.topImplements(10),
    AnalyticsRecommendation.terrainDistribution(),
    AnalyticsRecommendation.powerRangeDistribution(),
    AnalyticsRecommendation.averageRecommendedPower(),
  ]);

  const topTractors = topTractorsRows.map((row) => ({
    id: toInteger(row.tractor_id),
    name: row.name,
    brand: row.brand,
    model: row.model,
    value: toInteger(row.value),
    label: `${row.brand} ${row.model}`,
  }));

  const topImplements = topImplementsRows.map((row) => ({
    id: toInteger(row.implement_id),
    name: row.name,
    brand: row.brand,
    type: row.implement_type,
    value: toInteger(row.value),
    label: `${row.brand} ${row.name}`,
  }));

  const response = {
    success: true,
    message: 'Estadísticas de recomendaciones obtenidas exitosamente',
    data: {
      topTractors: {
        labels: topTractors.map((row) => row.label),
        series: topTractors.map((row) => row.value),
        data: topTractors,
      },
      topImplements: {
        labels: topImplements.map((row) => row.label),
        series: topImplements.map((row) => row.value),
        data: topImplements,
      },
      terrainDistribution: toChartData(terrainDistributionRows),
      powerRangeDistribution: toChartData(powerRangeDistributionRows),
      averageRecommendedPowerHp: roundToTwoDecimals(averagePowerRow?.average_power_hp),
      generatedAt: new Date().toISOString(),
    },
  };

  return res.status(200).json(response);
});

export const getUserStats = asyncHandler(async (req, res) => {
  const [
    usersByMonthRows,
    totalUsers,
    totalTerrains,
    totalQueries,
    activeUsersByQuery,
  ] = await Promise.all([
    AnalyticsUser.countByMonth(),
    AnalyticsUser.count(),
    AnalyticsTerrain.count(),
    AnalyticsQuery.count(),
    AnalyticsQuery.countByUser(),
  ]);

  const activeUsers = activeUsersByQuery.length;
  const inactiveUsers = totalUsers - activeUsers;
  const terrainsPerUser = totalUsers > 0 ? totalTerrains / totalUsers : 0;
  const queriesPerUser = totalUsers > 0 ? totalQueries / totalUsers : 0;

  const response = {
    success: true,
    message: 'Estadísticas de usuarios obtenidas exitosamente',
    data: {
      usersRegisteredByMonth: toChartData(usersByMonthRows),
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
      },
      averages: {
        terrainsPerUser: roundToTwoDecimals(terrainsPerUser),
        queriesPerUser: roundToTwoDecimals(queriesPerUser),
      },
      generatedAt: new Date().toISOString(),
    },
  };

  return res.status(200).json(response);
});

export default {
  getOverviewStats,
  getRecommendationStats,
  getUserStats,
};