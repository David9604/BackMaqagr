import { pool } from '../config/db.js';

class Implement {
  // Get all implements
  static async getAll() {
    const query = 'SELECT * FROM implement ORDER BY implement_type, brand';
    const result = await pool.query(query);
    return result.rows;
  }

  // Find implement by ID
  static async findById(id) {
    const query = 'SELECT * FROM implement WHERE implement_id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Create new implement
  static async create(implementData) {
    const {
      implement_name,
      brand,
      power_requirement_hp,
      working_width_m,
      soil_type,
      working_depth_cm,
      weight_kg,
      implement_type,
      status = 'available'
    } = implementData;

    const query = `
      INSERT INTO implement (
        implement_name, brand, power_requirement_hp, working_width_m,
        soil_type, working_depth_cm, weight_kg, implement_type, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      implement_name, brand, power_requirement_hp, working_width_m,
      soil_type, working_depth_cm, weight_kg, implement_type, status
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update implement
  static async update(id, implementData) {
    const {
      implement_name,
      brand,
      power_requirement_hp,
      working_width_m,
      soil_type,
      working_depth_cm,
      weight_kg,
      implement_type,
      status
    } = implementData;

    const query = `
      UPDATE implement 
      SET implement_name = COALESCE($1, implement_name),
          brand = COALESCE($2, brand),
          power_requirement_hp = COALESCE($3, power_requirement_hp),
          working_width_m = COALESCE($4, working_width_m),
          soil_type = COALESCE($5, soil_type),
          working_depth_cm = COALESCE($6, working_depth_cm),
          weight_kg = COALESCE($7, weight_kg),
          implement_type = COALESCE($8, implement_type),
          status = COALESCE($9, status)
      WHERE implement_id = $10
      RETURNING *
    `;
    const values = [
      implement_name, brand, power_requirement_hp, working_width_m,
      soil_type, working_depth_cm, weight_kg, implement_type, status, id
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete implement
  static async delete(id) {
    const query = 'DELETE FROM implement WHERE implement_id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Search by type
  static async searchByType(type) {
    const query = `
      SELECT * FROM implement 
      WHERE LOWER(implement_type) LIKE LOWER($1)
      ORDER BY brand
    `;
    const result = await pool.query(query, [`%${type}%`]);
    return result.rows;
  }

  // Find by power requirement
  static async findByMaxPowerRequirement(maxHP) {
    const query = `
      SELECT * FROM implement 
      WHERE power_requirement_hp <= $1
      AND status = 'available'
      ORDER BY power_requirement_hp DESC
    `;
    const result = await pool.query(query, [maxHP]);
    return result.rows;
  }

  // Get available implements
  static async getAvailable() {
    const query = `
      SELECT * FROM implement 
      WHERE status = 'available'
      ORDER BY implement_type, power_requirement_hp
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Search by soil type
  static async searchBySoilType(soilType) {
    const query = `
      SELECT * FROM implement 
      WHERE LOWER(soil_type) LIKE LOWER($1) OR soil_type = 'All'
      AND status = 'available'
      ORDER BY implement_type
    `;
    const result = await pool.query(query, [`%${soilType}%`]);
    return result.rows;
  }
}

export default Implement;
