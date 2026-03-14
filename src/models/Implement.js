import { pool } from "../config/db.js";

class Implement {
  // Get all implements
  static async getAll() {
    const query = "SELECT * FROM implement ORDER BY implement_type, brand";
    const result = await pool.query(query);
    return result.rows;
  }

  // Find implement by ID
  static async findById(id) {
    const query = "SELECT * FROM implement WHERE implement_id = $1";
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
      status = "available",
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
      implement_name,
      brand,
      power_requirement_hp,
      working_width_m,
      soil_type,
      working_depth_cm,
      weight_kg,
      implement_type,
      status,
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
      status,
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
      implement_name,
      brand,
      power_requirement_hp,
      working_width_m,
      soil_type,
      working_depth_cm,
      weight_kg,
      implement_type,
      status,
      id,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete implement
  static async delete(id) {
    const query = "DELETE FROM implement WHERE implement_id = $1 RETURNING *";
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

  // Advanced search with filters, relevance ordering, and DB-level pagination
  static async advancedSearch(filters = {}, tractorPower = null) {
    const {
      q,
      type,
      minWidth,
      maxWidth,
      requiredPower,
      limit = 10,
      offset = 0,
      sort,
      order = "asc",
    } = filters;

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    // Full-text search across implement_name and brand using ILIKE
    if (q) {
      const searchPattern = `%${q}%`;
      conditions.push(
        `(implement_name ILIKE $${paramIndex} OR brand ILIKE $${paramIndex})`,
      );
      values.push(searchPattern);
      paramIndex++;
    }

    // Exact or partial type filter (case-insensitive)
    if (type) {
      conditions.push(`LOWER(implement_type) = LOWER($${paramIndex})`);
      values.push(type);
      paramIndex++;
    }

    // Width range filter
    if (minWidth !== null && minWidth !== undefined) {
      conditions.push(`working_width_m >= $${paramIndex}`);
      values.push(minWidth);
      paramIndex++;
    }

    if (maxWidth !== null && maxWidth !== undefined) {
      conditions.push(`working_width_m <= $${paramIndex}`);
      values.push(maxWidth);
      paramIndex++;
    }

    // Required power filter
    if (requiredPower !== null && requiredPower !== undefined) {
      conditions.push(`power_requirement_hp <= $${paramIndex}`);
      values.push(requiredPower);
      paramIndex++;
    }

    // Tractor compatibility filtering
    if (tractorPower !== null && tractorPower !== undefined) {
      conditions.push(`power_requirement_hp <= $${paramIndex}`);
      values.push(tractorPower);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Build ORDER BY: relevance/compatibility first, then user sort
    let orderByClause;
    const validSortColumns = [
      "implement_name",
      "brand",
      "power_requirement_hp",
      "working_width_m",
      "implement_type",
      "status",
    ];
    const sortColumn =
      sort && validSortColumns.includes(sort) ? sort : "power_requirement_hp";
    const sortOrder = order === "desc" ? "DESC" : "ASC";

    if (q) {
      // Relevance: exact match in implement_name > brand > partial
      const relevanceIndex = paramIndex;
      values.push(q);
      paramIndex++;

      orderByClause = `ORDER BY 
        CASE 
          WHEN LOWER(implement_name) = LOWER($${relevanceIndex}) THEN 1
          WHEN LOWER(brand) = LOWER($${relevanceIndex}) THEN 2
          ELSE 3 
        END ASC, ${sortColumn} ${sortOrder}`;
    } else if (tractorPower !== null && tractorPower !== undefined) {
      // Compatibility: prioritize implements whose power requirement best matches the tractor's power
      const compatibilityIndex = paramIndex;
      values.push(tractorPower);
      paramIndex++;

      // Sort by the smallest difference between tractor power and implement required power
      orderByClause = `ORDER BY ABS($${compatibilityIndex} - power_requirement_hp) ASC, ${sortColumn} ${sortOrder}`;
    } else {
      orderByClause = `ORDER BY ${sortColumn} ${sortOrder}`;
    }

    // Count total matching records
    const countQuery = `SELECT COUNT(*) AS total FROM implement ${whereClause}`;

    // Adjust values to not include the extra sorting parameters (q or tractorPower) from the end
    let numWhereParams = conditions.length > 0 ? conditions.length : 0;

    // Calculate the number of values that belong to the WHERE clause using the original paramIndex before ordering
    const paramsUsedForWhere =
      paramIndex -
      1 -
      (q ? 1 : 0) -
      (!q && tractorPower !== null && tractorPower !== undefined ? 1 : 0);

    const countValues = values.slice(0, paramsUsedForWhere);

    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].total, 10);

    // Main query with pagination
    const limitIndex = paramIndex;
    const offsetIndex = paramIndex + 1;
    values.push(limit, offset);

    const dataQuery = `SELECT * FROM implement ${whereClause} ${orderByClause} LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
    const dataResult = await pool.query(dataQuery, values);

    return {
      data: dataResult.rows,
      total,
    };
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
