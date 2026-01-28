import { pool } from '../config/db.js';

class Role {
  // Get all roles
  static async getAll() {
    const query = 'SELECT * FROM role ORDER BY role_id';
    const result = await pool.query(query);
    return result.rows;
  }

  // Find role by ID
  static async findById(id) {
    const query = 'SELECT * FROM role WHERE role_id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Find role by name
  static async findByName(name) {
    const query = 'SELECT * FROM role WHERE role_name = $1';
    const result = await pool.query(query, [name]);
    return result.rows[0];
  }

  // Create new role
  static async create({ role_name, description, status = 'active' }) {
    const query = `
      INSERT INTO role (role_name, description, status)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [role_name, description, status];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update role
  static async update(id, { role_name, description, status }) {
    const query = `
      UPDATE role 
      SET role_name = COALESCE($1, role_name),
          description = COALESCE($2, description),
          status = COALESCE($3, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE role_id = $4
      RETURNING *
    `;
    const values = [role_name, description, status, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete role
  static async delete(id) {
    const query = 'DELETE FROM role WHERE role_id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

export default Role;
