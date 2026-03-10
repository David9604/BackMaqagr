import { pool } from '../config/db.js';
import redisClient from '../config/redis.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const OVERVIEW_CACHE_KEY = 'cache:admin:stats:overview:v1';
const OVERVIEW_CACHE_TTL_SECONDS = 3600; // 1 hora

const toInteger = (value) => parseInt(value, 10) || 0;
const toFloat = (value) => Number.parseFloat(value) || 0;
const canUseRedisCache = () => redisClient && redisClient.status === 'ready';

const toChartData = (rows) => ({
  labels: rows.map((row) => row.label),
  series: rows.map((row) => toFloat(row.value)),
  data: rows.map((row) => ({
    label: row.label,
    value: toFloat(row.value),
  })),
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

  const totalsQuery = `
    WITH users_agg AS (
      SELECT
        COUNT(*)::int AS total_users,
        COUNT(*) FILTER (WHERE status = 'active')::int AS active_users,
        COUNT(*) FILTER (WHERE status <> 'active')::int AS inactive_users
      FROM users
    )
    SELECT
      users_agg.total_users,
      users_agg.active_users,
      users_agg.inactive_users,
      (SELECT COUNT(*)::int FROM tractor) AS total_tractors,
      (SELECT COUNT(*)::int FROM implement) AS total_implements,
      (SELECT COUNT(*)::int FROM terrain) AS total_terrains,
      (SELECT COUNT(*)::int FROM query) AS total_queries,
      (SELECT COUNT(*)::int FROM recommendation) AS total_recommendations
    FROM users_agg
  `;

  const queriesByDayQuery = `
    SELECT
      TO_CHAR(day_bucket, 'YYYY-MM-DD') AS label,
      COALESCE(day_data.total, 0)::int AS value
    FROM GENERATE_SERIES(
      DATE_TRUNC('day', CURRENT_DATE - INTERVAL '29 days'),
      DATE_TRUNC('day', CURRENT_DATE),
      INTERVAL '1 day'
    ) AS day_bucket
    LEFT JOIN (
      SELECT
        DATE_TRUNC('day', query_date) AS bucket,
        COUNT(*)::int AS total
      FROM query
      WHERE query_date >= CURRENT_DATE - INTERVAL '29 days'
      GROUP BY DATE_TRUNC('day', query_date)
    ) AS day_data
      ON day_data.bucket = day_bucket
    ORDER BY day_bucket
  `;

  const queriesByWeekQuery = `
    SELECT
      TO_CHAR(DATE_TRUNC('week', query_date), 'IYYY-IW') AS label,
      COUNT(*)::int AS value
    FROM query
    WHERE query_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE_TRUNC('week', query_date)
    ORDER BY DATE_TRUNC('week', query_date)
  `;

  const queriesByMonthQuery = `
    SELECT
      TO_CHAR(DATE_TRUNC('month', query_date), 'YYYY-MM') AS label,
      COUNT(*)::int AS value
    FROM query
    WHERE query_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE_TRUNC('month', query_date)
    ORDER BY DATE_TRUNC('month', query_date)
  `;

  const [totalsResult, byDayResult, byWeekResult, byMonthResult] = await Promise.all([
    pool.query(totalsQuery),
    pool.query(queriesByDayQuery),
    pool.query(queriesByWeekQuery),
    pool.query(queriesByMonthQuery),
  ]);

  const totals = totalsResult.rows[0];

  const response = {
    success: true,
    message: 'Estadísticas generales obtenidas exitosamente',
    data: {
      totals: {
        users: {
          total: toInteger(totals.total_users),
          active: toInteger(totals.active_users),
          inactive: toInteger(totals.inactive_users),
        },
        tractors: toInteger(totals.total_tractors),
        implements: toInteger(totals.total_implements),
        terrains: toInteger(totals.total_terrains),
        queries: toInteger(totals.total_queries),
        recommendations: toInteger(totals.total_recommendations),
      },
      queriesTrend: {
        byDay: toChartData(byDayResult.rows),
        byWeek: toChartData(byWeekResult.rows),
        byMonth: toChartData(byMonthResult.rows),
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
  const topTractorsQuery = `
    SELECT
      tr.tractor_id AS id,
      tr.name,
      tr.brand,
      tr.model,
      COUNT(r.recommendation_id)::int AS value
    FROM recommendation r
    INNER JOIN tractor tr ON tr.tractor_id = r.tractor_id
    GROUP BY tr.tractor_id, tr.name, tr.brand, tr.model
    ORDER BY value DESC, tr.name ASC
    LIMIT 10
  `;

  const topImplementsQuery = `
    SELECT
      i.implement_id AS id,
      i.implement_name AS name,
      i.brand,
      i.implement_type,
      COUNT(r.recommendation_id)::int AS value
    FROM recommendation r
    INNER JOIN implement i ON i.implement_id = r.implement_id
    GROUP BY i.implement_id, i.implement_name, i.brand, i.implement_type
    ORDER BY value DESC, i.implement_name ASC
    LIMIT 10
  `;

  const terrainDistributionQuery = `
    SELECT
      COALESCE(t.soil_type, 'Sin tipo') AS label,
      COUNT(r.recommendation_id)::int AS value
    FROM recommendation r
    LEFT JOIN terrain t ON t.terrain_id = r.terrain_id
    GROUP BY COALESCE(t.soil_type, 'Sin tipo')
    ORDER BY value DESC, label ASC
  `;

  const powerRangeDistributionQuery = `
    SELECT
      bucket_label AS label,
      COUNT(*)::int AS value
    FROM (
      SELECT
        CASE
          WHEN tr.engine_power_hp < 60 THEN '0-59 HP'
          WHEN tr.engine_power_hp BETWEEN 60 AND 99 THEN '60-99 HP'
          WHEN tr.engine_power_hp BETWEEN 100 AND 149 THEN '100-149 HP'
          WHEN tr.engine_power_hp BETWEEN 150 AND 199 THEN '150-199 HP'
          ELSE '200+ HP'
        END AS bucket_label,
        CASE
          WHEN tr.engine_power_hp < 60 THEN 1
          WHEN tr.engine_power_hp BETWEEN 60 AND 99 THEN 2
          WHEN tr.engine_power_hp BETWEEN 100 AND 149 THEN 3
          WHEN tr.engine_power_hp BETWEEN 150 AND 199 THEN 4
          ELSE 5
        END AS bucket_order
      FROM recommendation r
      INNER JOIN tractor tr ON tr.tractor_id = r.tractor_id
    ) AS bucketed
    GROUP BY bucket_label, bucket_order
    ORDER BY bucket_order
  `;

  const averagePowerQuery = `
    SELECT
      COALESCE(ROUND(AVG(tr.engine_power_hp)::numeric, 2), 0)::float AS average_power_hp
    FROM recommendation r
    INNER JOIN tractor tr ON tr.tractor_id = r.tractor_id
  `;

  const [
    topTractorsResult,
    topImplementsResult,
    terrainDistributionResult,
    powerRangeDistributionResult,
    averagePowerResult,
  ] = await Promise.all([
    pool.query(topTractorsQuery),
    pool.query(topImplementsQuery),
    pool.query(terrainDistributionQuery),
    pool.query(powerRangeDistributionQuery),
    pool.query(averagePowerQuery),
  ]);

  const topTractors = topTractorsResult.rows.map((row) => ({
    id: toInteger(row.id),
    name: row.name,
    brand: row.brand,
    model: row.model,
    value: toInteger(row.value),
    label: `${row.brand} ${row.model}`,
  }));

  const topImplements = topImplementsResult.rows.map((row) => ({
    id: toInteger(row.id),
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
      terrainDistribution: toChartData(terrainDistributionResult.rows),
      powerRangeDistribution: toChartData(powerRangeDistributionResult.rows),
      averageRecommendedPowerHp: toFloat(averagePowerResult.rows[0].average_power_hp),
      generatedAt: new Date().toISOString(),
    },
  };

  return res.status(200).json(response);
});

export const getUserStats = asyncHandler(async (req, res) => {
  const usersByMonthQuery = `
    SELECT
      TO_CHAR(DATE_TRUNC('month', registration_date), 'YYYY-MM') AS label,
      COUNT(*)::int AS value
    FROM users
    GROUP BY DATE_TRUNC('month', registration_date)
    ORDER BY DATE_TRUNC('month', registration_date)
  `;

  const usersMetricsQuery = `
    WITH user_queries AS (
      SELECT
        u.user_id,
        COUNT(q.query_id)::int AS total_queries
      FROM users u
      LEFT JOIN query q ON q.user_id = u.user_id
      GROUP BY u.user_id
    ),
    user_terrains AS (
      SELECT
        u.user_id,
        COUNT(t.terrain_id)::int AS total_terrains
      FROM users u
      LEFT JOIN terrain t ON t.user_id = u.user_id
      GROUP BY u.user_id
    ),
    combined AS (
      SELECT
        q.user_id,
        q.total_queries,
        COALESCE(t.total_terrains, 0)::int AS total_terrains
      FROM user_queries q
      LEFT JOIN user_terrains t ON t.user_id = q.user_id
    )
    SELECT
      COUNT(*)::int AS total_users,
      COUNT(*) FILTER (WHERE total_queries > 0)::int AS active_users,
      COUNT(*) FILTER (WHERE total_queries = 0)::int AS inactive_users,
      COALESCE(ROUND(AVG(total_terrains)::numeric, 2), 0)::float AS avg_terrains_per_user,
      COALESCE(ROUND(AVG(total_queries)::numeric, 2), 0)::float AS avg_queries_per_user
    FROM combined
  `;

  const [usersByMonthResult, usersMetricsResult] = await Promise.all([
    pool.query(usersByMonthQuery),
    pool.query(usersMetricsQuery),
  ]);

  const metrics = usersMetricsResult.rows[0];

  const response = {
    success: true,
    message: 'Estadísticas de usuarios obtenidas exitosamente',
    data: {
      usersRegisteredByMonth: toChartData(usersByMonthResult.rows),
      users: {
        total: toInteger(metrics.total_users),
        active: toInteger(metrics.active_users),
        inactive: toInteger(metrics.inactive_users),
      },
      averages: {
        terrainsPerUser: toFloat(metrics.avg_terrains_per_user),
        queriesPerUser: toFloat(metrics.avg_queries_per_user),
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
