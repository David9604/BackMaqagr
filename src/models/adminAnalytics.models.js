/**
 * Admin Analytics Models — Raw SQL (pg)
 * Replaces previous Sequelize-based implementation.
 * All queries use pool.query from db.js for consistency with the rest of the codebase.
 */
import { pool } from '../config/db.js';

// ============================================
// AnalyticsUser
// ============================================

export const AnalyticsUser = {
  async countByStatus() {
    const { rows } = await pool.query(
      'SELECT status, COUNT(user_id)::int AS value FROM users GROUP BY status'
    );
    return rows;
  },

  async count() {
    const { rows } = await pool.query('SELECT COUNT(user_id)::int AS count FROM users');
    return rows[0].count;
  },

  async countByMonth() {
    const { rows } = await pool.query(
      `SELECT TO_CHAR(DATE_TRUNC('month', registration_date), 'YYYY-MM') AS label,
              COUNT(user_id)::int AS value
       FROM users
       GROUP BY DATE_TRUNC('month', registration_date)
       ORDER BY DATE_TRUNC('month', registration_date) ASC`
    );
    return rows;
  },
};

// ============================================
// AnalyticsTractor
// ============================================

export const AnalyticsTractor = {
  async count() {
    const { rows } = await pool.query('SELECT COUNT(tractor_id)::int AS count FROM tractor');
    return rows[0].count;
  },
};

// ============================================
// AnalyticsImplement
// ============================================

export const AnalyticsImplement = {
  async count() {
    const { rows } = await pool.query('SELECT COUNT(implement_id)::int AS count FROM implement');
    return rows[0].count;
  },
};

// ============================================
// AnalyticsTerrain
// ============================================

export const AnalyticsTerrain = {
  async count() {
    const { rows } = await pool.query('SELECT COUNT(terrain_id)::int AS count FROM terrain');
    return rows[0].count;
  },
};

// ============================================
// AnalyticsQuery
// ============================================

export const AnalyticsQuery = {
  async count() {
    const { rows } = await pool.query('SELECT COUNT(query_id)::int AS count FROM query');
    return rows[0].count;
  },

  async trendByBucket(bucketExpr, format, since) {
    const { rows } = await pool.query(
      `SELECT TO_CHAR(${bucketExpr}, $1) AS label, SUM(1)::int AS value
       FROM query
       WHERE query_date >= $2
       GROUP BY ${bucketExpr}
       ORDER BY ${bucketExpr} ASC`,
      [format, since]
    );
    return rows;
  },

  async countDistinctUsers() {
    const { rows } = await pool.query('SELECT COUNT(DISTINCT user_id)::int AS count FROM query');
    return rows[0].count;
  },

  async countByUser() {
    const { rows } = await pool.query(
      'SELECT user_id, COUNT(query_id)::int AS value FROM query GROUP BY user_id'
    );
    return rows;
  },
};

// ============================================
// AnalyticsRecommendation
// ============================================

export const AnalyticsRecommendation = {
  async count() {
    const { rows } = await pool.query('SELECT COUNT(recommendation_id)::int AS count FROM recommendation');
    return rows[0].count;
  },

  async topTractors(limit = 10) {
    const { rows } = await pool.query(
      `SELECT r.tractor_id, t.name, t.brand, t.model, COUNT(r.recommendation_id)::int AS value
       FROM recommendation r
       JOIN tractor t ON r.tractor_id = t.tractor_id
       GROUP BY r.tractor_id, t.name, t.brand, t.model
       ORDER BY value DESC, t.name ASC
       LIMIT $1`,
      [limit]
    );
    return rows;
  },

  async topImplements(limit = 10) {
    const { rows } = await pool.query(
      `SELECT r.implement_id, i.implement_name AS name, i.brand, i.implement_type, COUNT(r.recommendation_id)::int AS value
       FROM recommendation r
       JOIN implement i ON r.implement_id = i.implement_id
       GROUP BY r.implement_id, i.implement_name, i.brand, i.implement_type
       ORDER BY value DESC, i.implement_name ASC
       LIMIT $1`,
      [limit]
    );
    return rows;
  },

  async terrainDistribution() {
    const { rows } = await pool.query(
      `SELECT COALESCE(t.soil_type, 'Sin tipo') AS label, COUNT(r.recommendation_id)::int AS value
       FROM recommendation r
       LEFT JOIN terrain t ON r.terrain_id = t.terrain_id
       GROUP BY COALESCE(t.soil_type, 'Sin tipo')
       ORDER BY value DESC, label ASC`
    );
    return rows;
  },

  async powerRangeDistribution() {
    const { rows } = await pool.query(
      `SELECT
         CASE
           WHEN t.engine_power_hp < 60 THEN '0-59 HP'
           WHEN t.engine_power_hp BETWEEN 60 AND 99 THEN '60-99 HP'
           WHEN t.engine_power_hp BETWEEN 100 AND 149 THEN '100-149 HP'
           WHEN t.engine_power_hp BETWEEN 150 AND 199 THEN '150-199 HP'
           ELSE '200+ HP'
         END AS label,
         CASE
           WHEN t.engine_power_hp < 60 THEN 1
           WHEN t.engine_power_hp BETWEEN 60 AND 99 THEN 2
           WHEN t.engine_power_hp BETWEEN 100 AND 149 THEN 3
           WHEN t.engine_power_hp BETWEEN 150 AND 199 THEN 4
           ELSE 5
         END AS bucket_order,
         COUNT(r.recommendation_id)::int AS value
       FROM recommendation r
       JOIN tractor t ON r.tractor_id = t.tractor_id
       GROUP BY label, bucket_order
       ORDER BY bucket_order ASC`
    );
    return rows;
  },

  async averageRecommendedPower() {
    const { rows } = await pool.query(
      `SELECT AVG(t.engine_power_hp)::float AS average_power_hp
       FROM recommendation r
       JOIN tractor t ON r.tractor_id = t.tractor_id`
    );
    return rows[0];
  },
};

export default {
  AnalyticsUser,
  AnalyticsTractor,
  AnalyticsImplement,
  AnalyticsTerrain,
  AnalyticsQuery,
  AnalyticsRecommendation,
};