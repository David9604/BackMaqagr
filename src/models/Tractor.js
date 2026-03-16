import { pool } from "../config/db.js";

class Tractor {
  // Get all tractors
  static async getAll() {
    const query = "SELECT * FROM tractor ORDER BY brand, model";
    const result = await pool.query(query);
    return result.rows;
  }

  // Find tractor by ID
  static async findById(id) {
    const query = "SELECT * FROM tractor WHERE tractor_id = $1";
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
      price_usd,
      fuel_consumption_lph,
      maintenance_cost_per_hour,
      status = "available",
    } = tractorData;

    const query = `
      INSERT INTO tractor (
        name, brand, model, engine_power_hp, weight_kg, traction_force_kn,
        traction_type, tire_type, tire_width_mm, tire_diameter_mm,
        tire_pressure_psi, price_usd, fuel_consumption_lph, maintenance_cost_per_hour, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    const values = [
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
      price_usd,
      fuel_consumption_lph,
      maintenance_cost_per_hour,
      status,
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
      price_usd,
      fuel_consumption_lph,
      maintenance_cost_per_hour,
      status,
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
          price_usd = COALESCE($12, price_usd),
          fuel_consumption_lph = COALESCE($13, fuel_consumption_lph),
          maintenance_cost_per_hour = COALESCE($14, maintenance_cost_per_hour),
          status = COALESCE($15, status)
      WHERE tractor_id = $16
      RETURNING *
    `;
    const values = [
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
      price_usd,
      fuel_consumption_lph,
      maintenance_cost_per_hour,
      status,
      id,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete tractor
  static async delete(id) {
    const query = "DELETE FROM tractor WHERE tractor_id = $1 RETURNING *";
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

  // Advanced search with filters, relevance ordering, and DB-level pagination
  static async advancedSearch(filters = {}) {
    const {
      q,
      brand,
      minPower,
      maxPower,
      type,
      limit = 10,
      offset = 0,
      sort,
      order = "asc",
    } = filters;

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    // Full-text search across name, brand, model using ILIKE
    if (q) {
      const searchPattern = `%${q}%`;
      conditions.push(
        `(name ILIKE $${paramIndex} OR brand ILIKE $${paramIndex} OR model ILIKE $${paramIndex})`,
      );
      values.push(searchPattern);
      paramIndex++;
    }

    // Exact brand filter (case-insensitive)
    if (brand) {
      conditions.push(`LOWER(brand) = LOWER($${paramIndex})`);
      values.push(brand);
      paramIndex++;
    }

    // Power range filter
    if (minPower !== null && minPower !== undefined) {
      conditions.push(`engine_power_hp >= $${paramIndex}`);
      values.push(minPower);
      paramIndex++;
    }

    if (maxPower !== null && maxPower !== undefined) {
      conditions.push(`engine_power_hp <= $${paramIndex}`);
      values.push(maxPower);
      paramIndex++;
    }

    // Traction type filter (case-insensitive)
    if (type) {
      conditions.push(`LOWER(traction_type) = LOWER($${paramIndex})`);
      values.push(type);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Build ORDER BY: relevance first (if q provided), then user sort
    let orderByClause;
    if (q) {
      // Relevance: exact match in name > brand > model > partial
      const relevanceIndex = paramIndex;
      values.push(q);
      paramIndex++;

      const validSortColumns = [
        "name",
        "brand",
        "model",
        "engine_power_hp",
        "weight_kg",
        "traction_type",
        "status",
      ];
      const sortColumn =
        sort && validSortColumns.includes(sort) ? sort : "engine_power_hp";
      const sortOrder = order === "desc" ? "DESC" : "ASC";

      orderByClause = `ORDER BY 
        CASE 
          WHEN LOWER(name) = LOWER($${relevanceIndex}) THEN 1
          WHEN LOWER(brand) = LOWER($${relevanceIndex}) THEN 2
          WHEN LOWER(model) = LOWER($${relevanceIndex}) THEN 3
          ELSE 4 
        END ASC, ${sortColumn} ${sortOrder}`;
    } else {
      const validSortColumns = [
        "name",
        "brand",
        "model",
        "engine_power_hp",
        "weight_kg",
        "traction_type",
        "status",
      ];
      const sortColumn =
        sort && validSortColumns.includes(sort) ? sort : "engine_power_hp";
      const sortOrder = order === "desc" ? "DESC" : "ASC";
      orderByClause = `ORDER BY ${sortColumn} ${sortOrder}`;
    }

    // Count total matching records
    const countQuery = `SELECT COUNT(*) AS total FROM tractor ${whereClause}`;
    const countValues = values.slice(
      0,
      conditions.length > 0 ? conditions.length : 0,
    );

    // Adjust: countValues should be the values used in WHERE only (before relevance param)
    const whereValues = q ? values.slice(0, values.length - 1) : [...values];

    const countResult = await pool.query(countQuery, whereValues);
    const total = parseInt(countResult.rows[0].total, 10);

    // Main query with pagination
    const limitIndex = paramIndex;
    const offsetIndex = paramIndex + 1;
    values.push(limit, offset);

    const dataQuery = `SELECT * FROM tractor ${whereClause} ${orderByClause} LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
    const dataResult = await pool.query(dataQuery, values);

    return {
      data: dataResult.rows,
      total,
    };
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
