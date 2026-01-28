import { pool } from '../config/db.js';

class QueryHistory {
  // Create history record
  static async create(historyData) {
    const {
      user_id,
      query_id = null,
      action_type,
      description,
      result_json = null
    } = historyData;

    const query = `
      INSERT INTO query_history (
        user_id, query_id, action_type, description, result_json
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [user_id, query_id, action_type, description, result_json];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get all history by user
  static async findByUser(userId, limit = 50) {
    const query = `
      SELECT qh.*,
             q.query_type, q.query_date,
             t.name as tractor_name,
             i.implement_name
      FROM query_history qh
      LEFT JOIN query q ON qh.query_id = q.query_id
      LEFT JOIN tractor t ON q.tractor_id = t.tractor_id
      LEFT JOIN implement i ON q.implement_id = i.implement_id
      WHERE qh.user_id = $1
      ORDER BY qh.action_date DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  // Get history by action type
  static async findByActionType(actionType) {
    const query = `
      SELECT qh.*,
             u.name as user_name, u.email
      FROM query_history qh
      LEFT JOIN users u ON qh.user_id = u.user_id
      WHERE qh.action_type = $1
      ORDER BY qh.action_date DESC
    `;
    const result = await pool.query(query, [actionType]);
    return result.rows;
  }

  // Get history by query ID
  static async findByQueryId(queryId) {
    const query = `
      SELECT qh.*,
             u.name as user_name
      FROM query_history qh
      LEFT JOIN users u ON qh.user_id = u.user_id
      WHERE qh.query_id = $1
      ORDER BY qh.action_date DESC
    `;
    const result = await pool.query(query, [queryId]);
    return result.rows;
  }

  // Get all history
  static async getAll(limit = 100) {
    const query = `
      SELECT qh.*,
             u.name as user_name,
             q.query_type
      FROM query_history qh
      LEFT JOIN users u ON qh.user_id = u.user_id
      LEFT JOIN query q ON qh.query_id = q.query_id
      ORDER BY qh.action_date DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  // Get recent history (last 7 days)
  static async getRecent(days = 7, limit = 50) {
    const query = `
      SELECT qh.*,
             u.name as user_name,
             q.query_type
      FROM query_history qh
      LEFT JOIN users u ON qh.user_id = u.user_id
      LEFT JOIN query q ON qh.query_id = q.query_id
      WHERE qh.action_date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY qh.action_date DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  // Delete old history (older than specified days)
  static async deleteOldRecords(days = 90) {
    const query = `
      DELETE FROM query_history 
      WHERE action_date < CURRENT_DATE - INTERVAL '${days} days'
      RETURNING *
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Get history statistics
  static async getStatistics() {
    const query = `
      SELECT 
        action_type,
        COUNT(*) as count,
        MAX(action_date) as last_action
      FROM query_history
      GROUP BY action_type
      ORDER BY count DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Delete history record
  static async delete(id) {
    const query = 'DELETE FROM query_history WHERE history_id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

export default QueryHistory;
