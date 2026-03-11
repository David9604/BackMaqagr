import { pool } from '../config/db.js';

class Notification {
  static async create({ userId, type, title, message, data = null }) {
    const { rows } = await pool.query(
      `INSERT INTO notification 
       (user_id, type, title, message, data, read, created_at)
       VALUES ($1, $2, $3, $4, $5, false, NOW())
       RETURNING *`,
      [userId, type, title, message, JSON.stringify(data)]
    );
    return rows[0];
  }

  static async findByUser(userId, { page = 1, limit = 20, read } = {}) {
    const offset = (page - 1) * limit;
    
    let readFilter = "";
    let params = [userId, limit, offset];
    
    if (read !== undefined) {
      // Assuming 'read' is passed as boolean or 'true'/'false' string
      const isRead = read === true || read === 'true';
      readFilter = `AND read = $4`;
      params.push(isRead);
    }
    
    // Note: the original snippet filtered exactly `AND read = ${read}` which
    // is prone to SQL injection, use parameterized inputs instead:
    const { rows } = await pool.query(
      `SELECT * FROM notification
       WHERE user_id = $1 ${readFilter}
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      params
    );
    return rows;
  }

  static async countUnread(userId) {
    const { rows } = await pool.query(
      `SELECT COUNT(*) as count FROM notification
       WHERE user_id = $1 AND read = false`,
      [userId]
    );
    return parseInt(rows[0].count);
  }

  static async markAsRead(notificationId, userId) {
    const { rows } = await pool.query(
      `UPDATE notification SET read = true
       WHERE notification_id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );
    return rows[0];
  }

  static async markAllAsRead(userId) {
    const { rows } = await pool.query(
      `UPDATE notification SET read = true
       WHERE user_id = $1 AND read = false
       RETURNING *`,
      [userId]
    );
    return rows;
  }

  static async delete(notificationId, userId) {
    const { rows } = await pool.query(
      `DELETE FROM notification
       WHERE notification_id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );
    return rows[0];
  }
}

export default Notification;
