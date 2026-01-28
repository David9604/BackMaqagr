import { pool } from '../config/db.js';

class User {
  // Create a new user
  static async create({ name, email, password, role_id, status = 'active' }) {
    const query = `
      INSERT INTO users (name, email, password, role_id, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING user_id, name, email, role_id, status, registration_date
    `;
    const values = [name, email, password, role_id, status];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const query = `
      SELECT u.*, r.role_name 
      FROM users u
      LEFT JOIN role r ON u.role_id = r.role_id
      WHERE u.email = $1
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const query = `
      SELECT u.*, r.role_name 
      FROM users u
      LEFT JOIN role r ON u.role_id = r.role_id
      WHERE u.user_id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Get all users
  static async getAll() {
    const query = `
      SELECT u.user_id, u.name, u.email, u.status, u.registration_date, 
             u.last_session, r.role_name
      FROM users u
      LEFT JOIN role r ON u.role_id = r.role_id
      ORDER BY u.registration_date DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Update user
  static async update(id, { name, email, role_id, status }) {
    const query = `
      UPDATE users 
      SET name = COALESCE($1, name),
          email = COALESCE($2, email),
          role_id = COALESCE($3, role_id),
          status = COALESCE($4, status)
      WHERE user_id = $5
      RETURNING user_id, name, email, role_id, status, registration_date
    `;
    const values = [name, email, role_id, status, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update last session
  static async updateLastSession(id) {
    const query = `
      UPDATE users 
      SET last_session = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING user_id, last_session
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Delete user
  static async delete(id) {
    const query = 'DELETE FROM users WHERE user_id = $1 RETURNING user_id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Update password
  static async updatePassword(id, hashedPassword) {
    const query = `
      UPDATE users 
      SET password = $1
      WHERE user_id = $2
      RETURNING user_id
    `;
    const result = await pool.query(query, [hashedPassword, id]);
    return result.rows[0];
  }
}

export default User;
