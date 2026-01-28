import { pool } from '../config/db.js';

class Terrain {
  // Get all terrains
  static async getAll() {
    const query = 'SELECT * FROM terrain ORDER BY name';
    const result = await pool.query(query);
    return result.rows;
  }

  // Find terrain by ID
  static async findById(id) {
    const query = 'SELECT * FROM terrain WHERE terrain_id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Create new terrain
  static async create(terrainData) {
    const {
      name,
      altitude_meters,
      slope_percentage,
      soil_type,
      temperature_celsius,
      status = 'active'
    } = terrainData;

    const query = `
      INSERT INTO terrain (
        name, altitude_meters, slope_percentage, soil_type,
        temperature_celsius, status
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      name, altitude_meters, slope_percentage, soil_type,
      temperature_celsius, status
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update terrain
  static async update(id, terrainData) {
    const {
      name,
      altitude_meters,
      slope_percentage,
      soil_type,
      temperature_celsius,
      status
    } = terrainData;

    const query = `
      UPDATE terrain 
      SET name = COALESCE($1, name),
          altitude_meters = COALESCE($2, altitude_meters),
          slope_percentage = COALESCE($3, slope_percentage),
          soil_type = COALESCE($4, soil_type),
          temperature_celsius = COALESCE($5, temperature_celsius),
          status = COALESCE($6, status)
      WHERE terrain_id = $7
      RETURNING *
    `;
    const values = [
      name, altitude_meters, slope_percentage, soil_type,
      temperature_celsius, status, id
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete terrain
  static async delete(id) {
    const query = 'DELETE FROM terrain WHERE terrain_id = $1 RETURNING *';
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
