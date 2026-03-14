import { pool } from "../config/db.js";

class Terrain {
  // Get all terrains (admin use - shows all)
  static async getAll() {
    const query = "SELECT * FROM terrain ORDER BY name";
    const result = await pool.query(query);
    return result.rows;
  }

  // Get terrains by user ID (for authenticated users)
  static async findByUserId(userId) {
    const query = `
      SELECT * FROM terrain 
      WHERE user_id = $1 
      ORDER BY name
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Find terrain by ID
  static async findById(id) {
    const query = "SELECT * FROM terrain WHERE terrain_id = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Find terrain by ID and User ID (ownership verification)
  static async findByIdAndUser(id, userId) {
    const query = `
      SELECT * FROM terrain 
      WHERE terrain_id = $1 AND user_id = $2
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }

  // Create new terrain (with user_id)
  static async create(terrainData) {
    const {
      user_id,
      name,
      area_hectares,
      altitude_meters,
      slope_percentage,
      soil_type,
      temperature_celsius,
      status = "active",
    } = terrainData;

    const query = `
      INSERT INTO terrain (
        user_id, name, area_hectares, altitude_meters, slope_percentage, soil_type,
        temperature_celsius, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      user_id,
      name,
      area_hectares,
      altitude_meters,
      slope_percentage,
      soil_type,
      temperature_celsius,
      status,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update terrain
  static async update(id, terrainData) {
    const {
      name,
      area_hectares,
      altitude_meters,
      slope_percentage,
      soil_type,
      temperature_celsius,
      status,
    } = terrainData;

    const query = `
      UPDATE terrain 
      SET name = COALESCE($1, name),
          area_hectares = COALESCE($2, area_hectares),
          altitude_meters = COALESCE($3, altitude_meters),
          slope_percentage = COALESCE($4, slope_percentage),
          soil_type = COALESCE($5, soil_type),
          temperature_celsius = COALESCE($6, temperature_celsius),
          status = COALESCE($7, status)
      WHERE terrain_id = $8
      RETURNING *
    `;
    const values = [
      name,
      area_hectares,
      altitude_meters,
      slope_percentage,
      soil_type,
      temperature_celsius,
      status,
      id,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete terrain
  static async delete(id) {
    const query = "DELETE FROM terrain WHERE terrain_id = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Search by soil type
  static async searchBySoilType(soilType) {
    const query = `
      SELECT * FROM terrain 
      WHERE LOWER(soil_type) LIKE LOWER($1)
      ORDER BY name
    `;
    const result = await pool.query(query, [`%${soilType}%`]);
    return result.rows;
  }

  // Get active terrains
  static async getActive() {
    const query = `
      SELECT * FROM terrain 
      WHERE status = 'active'
      ORDER BY name
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Search by altitude range
  static async searchByAltitudeRange(minAltitude, maxAltitude) {
    const query = `
      SELECT * FROM terrain 
      WHERE altitude_meters BETWEEN $1 AND $2
      ORDER BY altitude_meters
    `;
    const result = await pool.query(query, [minAltitude, maxAltitude]);
    return result.rows;
  }
}

export default Terrain;
