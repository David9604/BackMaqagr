import { pool } from './src/config/db.js';

const sql = `
CREATE TABLE IF NOT EXISTS notification (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notification_user_unread ON notification(user_id, read) WHERE read = false;
`;

async function run() {
  try {
    await pool.query(sql);
    console.log("Table notification created successfully");
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    pool.end();
  }
}

run();
