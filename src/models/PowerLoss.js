import { pool } from '../config/db.js';

class PowerLoss {
  // Create power loss record
  static async create(powerLossData) {
    const {
      query_id,
      slope_loss_hp,
      altitude_loss_hp,
      rolling_resistance_loss_hp,
      slippage_loss_hp,
      total_loss_hp,
      available_power_hp,
      net_power_hp,
      efficiency_percentage
    } = powerLossData;

    const query = `
      INSERT INTO power_loss (
        query_id, slope_loss_hp, altitude_loss_hp,
        rolling_resistance_loss_hp, slippage_loss_hp,
        total_loss_hp, available_power_hp, net_power_hp,
        efficiency_percentage
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      query_id, slope_loss_hp, altitude_loss_hp,
      rolling_resistance_loss_hp, slippage_loss_hp,
      total_loss_hp, available_power_hp, net_power_hp,
      efficiency_percentage
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Find power loss by query ID
  static async findByQueryId(queryId) {
    const query = `
      SELECT pl.*,
             q.query_type, q.query_date,
             t.name as tractor_name, t.engine_power_hp,
             u.name as user_name
      FROM power_loss pl
      LEFT JOIN query q ON pl.query_id = q.query_id
      LEFT JOIN tractor t ON q.tractor_id = t.tractor_id
      LEFT JOIN users u ON q.user_id = u.user_id
      WHERE pl.query_id = $1
    `;
    const result = await pool.query(query, [queryId]);
    return result.rows[0];
  }

  // Find power loss by ID
  static async findById(id) {
    const query = 'SELECT * FROM power_loss WHERE power_loss_id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Get all power loss records
  static async getAll() {
    const query = `
      SELECT pl.*,
             q.query_date,
             t.name as tractor_name,
             u.name as user_name
      FROM power_loss pl
      LEFT JOIN query q ON pl.query_id = q.query_id
      LEFT JOIN tractor t ON q.tractor_id = t.tractor_id
      LEFT JOIN users u ON q.user_id = u.user_id
      ORDER BY pl.calculation_date DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Get power loss statistics
  static async getStatistics() {
    const query = `
      SELECT 
        AVG(total_loss_hp) as avg_total_loss,
        AVG(efficiency_percentage) as avg_efficiency,
        MIN(net_power_hp) as min_net_power,
        MAX(net_power_hp) as max_net_power,
        COUNT(*) as total_calculations
      FROM power_loss
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }

  // Get power loss by efficiency range
  static async findByEfficiencyRange(minEfficiency, maxEfficiency) {
    const query = `
      SELECT pl.*,
             t.name as tractor_name,
             ter.name as terrain_name
      FROM power_loss pl
      LEFT JOIN query q ON pl.query_id = q.query_id
      LEFT JOIN tractor t ON q.tractor_id = t.tractor_id
      LEFT JOIN terrain ter ON q.terrain_id = ter.terrain_id
      WHERE pl.efficiency_percentage BETWEEN $1 AND $2
      ORDER BY pl.efficiency_percentage DESC
    `;
    const result = await pool.query(query, [minEfficiency, maxEfficiency]);
    return result.rows;
  }

  // Delete power loss record
  static async delete(id) {
    const query = 'DELETE FROM power_loss WHERE power_loss_id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

export default PowerLoss;
