import { pool } from '../config/db.js';

class Recommendation {
  // Create new recommendation
  static async create(recommendationData) {
    const {
      user_id,
      terrain_id,
      tractor_id = null,
      implement_id = null,
      compatibility_score,
      observations,
      work_type
    } = recommendationData;

    const query = `
      INSERT INTO recommendation (
        user_id, terrain_id, tractor_id, implement_id,
        compatibility_score, observations, work_type
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      user_id, terrain_id, tractor_id, implement_id,
      compatibility_score, observations, work_type
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Find recommendation by ID with all details
  static async findById(id) {
    const query = `
      SELECT r.*,
             u.name as user_name, u.email,
             t.name as terrain_name, t.soil_type, t.slope_percentage,
             tr.name as tractor_name, tr.brand as tractor_brand, tr.model as tractor_model,
             tr.engine_power_hp,
             i.implement_name, i.implement_type, i.power_requirement_hp
      FROM recommendation r
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN terrain t ON r.terrain_id = t.terrain_id
      LEFT JOIN tractor tr ON r.tractor_id = tr.tractor_id
      LEFT JOIN implement i ON r.implement_id = i.implement_id
      WHERE r.recommendation_id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Get all recommendations by user
  static async findByUser(userId) {
    const query = `
      SELECT r.*,
             t.name as terrain_name, t.soil_type,
             tr.name as tractor_name, tr.brand as tractor_brand,
             i.implement_name, i.implement_type
      FROM recommendation r
      LEFT JOIN terrain t ON r.terrain_id = t.terrain_id
      LEFT JOIN tractor tr ON r.tractor_id = tr.tractor_id
      LEFT JOIN implement i ON r.implement_id = i.implement_id
      WHERE r.user_id = $1
      ORDER BY r.recommendation_date DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Get recommendations by terrain
  static async findByTerrain(terrainId) {
    const query = `
      SELECT r.*,
             u.name as user_name,
             tr.name as tractor_name, tr.brand as tractor_brand,
             i.implement_name, i.implement_type
      FROM recommendation r
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN tractor tr ON r.tractor_id = tr.tractor_id
      LEFT JOIN implement i ON r.implement_id = i.implement_id
      WHERE r.terrain_id = $1
      ORDER BY r.compatibility_score DESC, r.recommendation_date DESC
    `;
    const result = await pool.query(query, [terrainId]);
    return result.rows;
  }

  // Get all recommendations
  static async getAll() {
    const query = `
      SELECT r.*,
             u.name as user_name,
             t.name as terrain_name,
             tr.name as tractor_name, tr.brand as tractor_brand,
             i.implement_name
      FROM recommendation r
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN terrain t ON r.terrain_id = t.terrain_id
      LEFT JOIN tractor tr ON r.tractor_id = tr.tractor_id
      LEFT JOIN implement i ON r.implement_id = i.implement_id
      ORDER BY r.recommendation_date DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Get top recommendations by compatibility score
  static async getTopRecommendations(limit = 10) {
    const query = `
      SELECT r.*,
             u.name as user_name,
             t.name as terrain_name,
             tr.name as tractor_name,
             i.implement_name
      FROM recommendation r
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN terrain t ON r.terrain_id = t.terrain_id
      LEFT JOIN tractor tr ON r.tractor_id = tr.tractor_id
      LEFT JOIN implement i ON r.implement_id = i.implement_id
      WHERE r.compatibility_score IS NOT NULL
      ORDER BY r.compatibility_score DESC, r.recommendation_date DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  // Update recommendation
  static async update(id, updateData) {
    const {
      tractor_id,
      implement_id,
      compatibility_score,
      observations,
      work_type
    } = updateData;

    const query = `
      UPDATE recommendation 
      SET tractor_id = COALESCE($1, tractor_id),
          implement_id = COALESCE($2, implement_id),
          compatibility_score = COALESCE($3, compatibility_score),
          observations = COALESCE($4, observations),
          work_type = COALESCE($5, work_type)
      WHERE recommendation_id = $6
      RETURNING *
    `;
    const values = [
      tractor_id, implement_id, compatibility_score,
      observations, work_type, id
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete recommendation
  static async delete(id) {
    const query = 'DELETE FROM recommendation WHERE recommendation_id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Get recommendations by work type
  static async findByWorkType(workType) {
    const query = `
      SELECT r.*,
             u.name as user_name,
             t.name as terrain_name,
             tr.name as tractor_name,
             i.implement_name
      FROM recommendation r
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN terrain t ON r.terrain_id = t.terrain_id
      LEFT JOIN tractor tr ON r.tractor_id = tr.tractor_id
      LEFT JOIN implement i ON r.implement_id = i.implement_id
      WHERE LOWER(r.work_type) LIKE LOWER($1)
      ORDER BY r.compatibility_score DESC
    `;
    const result = await pool.query(query, [`%${workType}%`]);
    return result.rows;
  }
}

export default Recommendation;
