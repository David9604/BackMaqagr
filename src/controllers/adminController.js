import { Op, col, fn, literal } from 'sequelize';
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

const getTrendRows = async (bucket, format) => AnalyticsQuery.findAll({
  attributes: [
    [fn('TO_CHAR', bucket, format), 'label'],
    [fn('SUM', literal('1')), 'value'],
  ],
  where: {
    query_date: {
      [Op.gte]: getLast30DaysStart(),
    },
  },
  group: [bucket],
  order: [[bucket, 'ASC']],
  raw: true,
});

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

  const dayBucket = fn('DATE_TRUNC', 'day', col('query_date'));
  const weekBucket = fn('DATE_TRUNC', 'week', col('query_date'));
  const monthBucket = fn('DATE_TRUNC', 'month', col('query_date'));

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
    AnalyticsUser.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('user_id')), 'value'],
      ],
      group: ['status'],
      raw: true,
    }),
    AnalyticsTractor.count(),
    AnalyticsImplement.count(),
    AnalyticsTerrain.count(),
    AnalyticsQuery.count(),
    AnalyticsRecommendation.count(),
    getTrendRows(dayBucket, 'YYYY-MM-DD'),
    getTrendRows(weekBucket, 'IYYY-IW'),
    getTrendRows(monthBucket, 'YYYY-MM'),
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
  const powerRangeLabel = `
    CASE
      WHEN "tractor"."engine_power_hp" < 60 THEN '0-59 HP'
      WHEN "tractor"."engine_power_hp" BETWEEN 60 AND 99 THEN '60-99 HP'
      WHEN "tractor"."engine_power_hp" BETWEEN 100 AND 149 THEN '100-149 HP'
      WHEN "tractor"."engine_power_hp" BETWEEN 150 AND 199 THEN '150-199 HP'
      ELSE '200+ HP'
    END
  `;
  const powerRangeOrder = `
    CASE
      WHEN "tractor"."engine_power_hp" < 60 THEN 1
      WHEN "tractor"."engine_power_hp" BETWEEN 60 AND 99 THEN 2
      WHEN "tractor"."engine_power_hp" BETWEEN 100 AND 149 THEN 3
      WHEN "tractor"."engine_power_hp" BETWEEN 150 AND 199 THEN 4
      ELSE 5
    END
  `;

  const [
    topTractorsRows,
    topImplementsRows,
    terrainDistributionRows,
    powerRangeDistributionRows,
    averagePowerRow,
  ] = await Promise.all([
    AnalyticsRecommendation.findAll({
      attributes: [
        'tractor_id',
        [col('tractor.name'), 'name'],
        [col('tractor.brand'), 'brand'],
        [col('tractor.model'), 'model'],
        [fn('COUNT', col('AnalyticsRecommendation.recommendation_id')), 'value'],
      ],
      include: [
        {
          model: AnalyticsTractor,
          as: 'tractor',
          attributes: [],
          required: true,
        },
      ],
      group: [
        'AnalyticsRecommendation.tractor_id',
        'tractor.tractor_id',
        'tractor.name',
        'tractor.brand',
        'tractor.model',
      ],
      order: [literal('"value" DESC'), literal('"tractor"."name" ASC')],
      limit: 10,
      subQuery: false,
      raw: true,
    }),
    AnalyticsRecommendation.findAll({
      attributes: [
        'implement_id',
        [col('implement.implement_name'), 'name'],
        [col('implement.brand'), 'brand'],
        [col('implement.implement_type'), 'implement_type'],
        [fn('COUNT', col('AnalyticsRecommendation.recommendation_id')), 'value'],
      ],
      include: [
        {
          model: AnalyticsImplement,
          as: 'implement',
          attributes: [],
          required: true,
        },
      ],
      group: [
        'AnalyticsRecommendation.implement_id',
        'implement.implement_id',
        'implement.implement_name',
        'implement.brand',
        'implement.implement_type',
      ],
      order: [literal('"value" DESC'), literal('"implement"."implement_name" ASC')],
      limit: 10,
      subQuery: false,
      raw: true,
    }),
    AnalyticsRecommendation.findAll({
      attributes: [
        [fn('COALESCE', col('terrain.soil_type'), 'Sin tipo'), 'label'],
        [fn('COUNT', col('AnalyticsRecommendation.recommendation_id')), 'value'],
      ],
      include: [
        {
          model: AnalyticsTerrain,
          as: 'terrain',
          attributes: [],
          required: false,
        },
      ],
      group: [fn('COALESCE', col('terrain.soil_type'), 'Sin tipo')],
      order: [literal('"value" DESC'), literal('"label" ASC')],
      raw: true,
    }),
    AnalyticsRecommendation.findAll({
      attributes: [
        [literal(powerRangeLabel), 'label'],
        [literal(powerRangeOrder), 'bucket_order'],
        [fn('COUNT', col('AnalyticsRecommendation.recommendation_id')), 'value'],
      ],
      include: [
        {
          model: AnalyticsTractor,
          as: 'tractor',
          attributes: [],
          required: true,
        },
      ],
      group: [literal(powerRangeLabel), literal(powerRangeOrder)],
      order: [literal('bucket_order ASC')],
      raw: true,
    }),
    AnalyticsRecommendation.findOne({
      attributes: [
        [fn('AVG', col('tractor.engine_power_hp')), 'average_power_hp'],
      ],
      include: [
        {
          model: AnalyticsTractor,
          as: 'tractor',
          attributes: [],
          required: true,
        },
      ],
      raw: true,
    }),
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
  const monthBucket = fn('DATE_TRUNC', 'month', col('registration_date'));

  const [
    usersByMonthRows,
    totalUsers,
    totalTerrains,
    totalQueries,
    activeUsersByQuery,
  ] = await Promise.all([
    AnalyticsUser.findAll({
      attributes: [
        [fn('TO_CHAR', monthBucket, 'YYYY-MM'), 'label'],
        [fn('COUNT', col('user_id')), 'value'],
      ],
      group: [monthBucket],
      order: [[monthBucket, 'ASC']],
      raw: true,
    }),
    AnalyticsUser.count(),
    AnalyticsTerrain.count(),
    AnalyticsQuery.count(),
    AnalyticsQuery.findAll({
      attributes: [
        'user_id',
        [fn('COUNT', col('query_id')), 'value'],
      ],
      group: ['user_id'],
      raw: true,
    }),
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
