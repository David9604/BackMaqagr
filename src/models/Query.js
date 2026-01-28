import { pool } from '../config/db.js';

class Query {
  // Create new query
  static async create(queryData) {
    const {
      user_id,
      terrain_id,
      tractor_id,
      implement_id = null,
      pto_distance_m,
      carried_objects_weight_kg = 0,
      working_speed_kmh,
      query_type,
      status = 'completed'
    } = queryData;

    const query = `
      INSERT INTO query (
        user_id, terrain_id, tractor_id, implement_id,
        pto_distance_m, carried_objects_weight_kg, working_speed_kmh,
        query_type, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      user_id, terrain_id, tractor_id, implement_id,
      pto_distance_m, carried_objects_weight_kg, working_speed_kmh,
      query_type, status
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Find query by ID with all related data
  static async findById(id) {
    const query = `
      SELECT q.*, 
             u.name as user_name, u.email,
             t.name as terrain_name, t.soil_type, t.slope_percentage, t.altitude_meters,
             tr.name as tractor_name, tr.brand as tractor_brand, tr.model as tractor_model,
             tr.engine_power_hp,
             i.implement_name, i.implement_type, i.power_requirement_hp
      FROM query q
      LEFT JOIN users u ON q.user_id = u.user_id
      LEFT JOIN terrain t ON q.terrain_id = t.terrain_id
      LEFT JOIN tractor tr ON q.tractor_id = tr.tractor_id
      LEFT JOIN implement i ON q.implement_id = i.implement_id
      WHERE q.query_id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Get all queries by user
  static async findByUser(userId) {
    const query = `
      SELECT q.*,
             t.name as terrain_name,
             tr.name as tractor_name, tr.brand as tractor_brand,
             i.implement_name
      FROM query q
      LEFT JOIN terrain t ON q.terrain_id = t.terrain_id
      LEFT JOIN tractor tr ON q.tractor_id = tr.tractor_id
      LEFT JOIN implement i ON q.implement_id = i.implement_id
      WHERE q.user_id = $1
      ORDER BY q.query_date DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Get queries by type
  static async findByType(queryType) {
    const query = `
      SELECT q.*,
             u.name as user_name,
             t.name as terrain_name,
             tr.name as tractor_name
      FROM query q
      LEFT JOIN users u ON q.user_id = u.user_id
      LEFT JOIN terrain t ON q.terrain_id = t.terrain_id
      LEFT JOIN tractor tr ON q.tractor_id = tr.tractor_id
      WHERE q.query_type = $1
      ORDER BY q.query_date DESC
    `;
    const result = await pool.query(query, [queryType]);
    return result.rows;
  }

  // Get all queries
  static async getAll() {
    const query = `
      SELECT q.*,
             u.name as user_name,
             t.name as terrain_name,
             tr.name as tractor_name,
             i.implement_name
      FROM query q
      LEFT JOIN users u ON q.user_id = u.user_id
      LEFT JOIN terrain t ON q.terrain_id = t.terrain_id
      LEFT JOIN tractor tr ON q.tractor_id = tr.tractor_id
      LEFT JOIN implement i ON q.implement_id = i.implement_id
      ORDER BY q.query_date DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Update query status
  static async updateStatus(id, status) {
    const query = `
      UPDATE query 
      SET status = $1
      WHERE query_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  // Delete query
  static async delete(id) {
    const query = 'DELETE FROM query WHERE query_id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Get recent queries (last 30 days)
  static async getRecent(limit = 50) {
    const query = `
      SELECT q.*,
             u.name as user_name,
             t.name as terrain_name,
             tr.name as tractor_name
      FROM query q
      LEFT JOIN users u ON q.user_id = u.user_id
      LEFT JOIN terrain t ON q.terrain_id = t.terrain_id
      LEFT JOIN tractor tr ON q.tractor_id = tr.tractor_id
      WHERE q.query_date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY q.query_date DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }
}

export default Query;
