import { pool } from '../config/db.js';

class Tractor {
  // Get all tractors
  static async getAll() {
    const query = 'SELECT * FROM tractor ORDER BY brand, model';
    const result = await pool.query(query);
    return result.rows;
  }

  // Find tractor by ID
  static async findById(id) {
    const query = 'SELECT * FROM tractor WHERE tractor_id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Create new tractor
  static async create(tractorData) {
    const {
      name,
      brand,
      model,
      engine_power_hp,
      weight_kg,
      traction_force_kn,
      traction_type,
      tire_type,
      tire_width_mm,
      tire_diameter_mm,
      tire_pressure_psi,
      status = 'available'
    } = tractorData;

    const query = `
      INSERT INTO tractor (
        name, brand, model, engine_power_hp, weight_kg, traction_force_kn,
        traction_type, tire_type, tire_width_mm, tire_diameter_mm,
        tire_pressure_psi, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const values = [
      name, brand, model, engine_power_hp, weight_kg, traction_force_kn,
      traction_type, tire_type, tire_width_mm, tire_diameter_mm,
      tire_pressure_psi, status
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update tractor
  static async update(id, tractorData) {
    const {
      name,
      brand,
      model,
      engine_power_hp,
      weight_kg,
      traction_force_kn,
      traction_type,
      tire_type,
      tire_width_mm,
      tire_diameter_mm,
      tire_pressure_psi,
      status
    } = tractorData;

    const query = `
      UPDATE tractor 
      SET name = COALESCE($1, name),
          brand = COALESCE($2, brand),
          model = COALESCE($3, model),
          engine_power_hp = COALESCE($4, engine_power_hp),
          weight_kg = COALESCE($5, weight_kg),
          traction_force_kn = COALESCE($6, traction_force_kn),
          traction_type = COALESCE($7, traction_type),
          tire_type = COALESCE($8, tire_type),
          tire_width_mm = COALESCE($9, tire_width_mm),
          tire_diameter_mm = COALESCE($10, tire_diameter_mm),
          tire_pressure_psi = COALESCE($11, tire_pressure_psi),
          status = COALESCE($12, status)
      WHERE tractor_id = $13
      RETURNING *
    `;
    const values = [
      name, brand, model, engine_power_hp, weight_kg, traction_force_kn,
      traction_type, tire_type, tire_width_mm, tire_diameter_mm,
      tire_pressure_psi, status, id
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete tractor
  static async delete(id) {
    const query = 'DELETE FROM tractor WHERE tractor_id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Search by power range
  static async searchByPowerRange(minHP, maxHP) {
    const query = `
      SELECT * FROM tractor 
      WHERE engine_power_hp BETWEEN $1 AND $2
      AND status = 'available'
      ORDER BY engine_power_hp
    `;
    const result = await pool.query(query, [minHP, maxHP]);
    return result.rows;
  }

  // Search by brand
  static async searchByBrand(brand) {
    const query = `
      SELECT * FROM tractor 
      WHERE LOWER(brand) LIKE LOWER($1)
      ORDER BY model
    `;
    const result = await pool.query(query, [`%${brand}%`]);
    return result.rows;
  }

  // Get available tractors
  static async getAvailable() {
    const query = `
      SELECT * FROM tractor 
      WHERE status = 'available'
      ORDER BY engine_power_hp DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

export default Tractor;
