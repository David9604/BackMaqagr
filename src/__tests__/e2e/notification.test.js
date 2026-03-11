import request from 'supertest';
import app from '../../app.js';
import { pool } from '../../config/db.js';
import TestDataFactory from './helpers/test-fixtures.js';
import redisClient from '../../config/redis.js';

describe('Notification API E2E', () => {
  let user, token, adminUser, adminToken;
  let notificationId;

  beforeAll(async () => {
    // Check DB connection
    await pool.query('SELECT 1');
    
    const userSetup = await TestDataFactory.createAuthenticatedUser(2);
    user = userSetup.user;
    token = userSetup.token;

    const adminSetup = await TestDataFactory.createAuthenticatedUser(1);
    adminUser = adminSetup.user;
    adminToken = adminSetup.token;
  });

  afterAll(async () => {
    // Limpieza de datos
    if (user?.user_id) {
      await pool.query('DELETE FROM users WHERE user_id IN ($1, $2)', [user.user_id, adminUser.user_id]);
    }
    await pool.query('DELETE FROM notification');
    await pool.end();
    
    if (redisClient) {
      await redisClient.quit();
    }
  });

  describe('Notification CRUD', () => {
    beforeAll(async () => {
      // Inserción manual de una notificación base para las pruebas
      const res = await pool.query(
        `INSERT INTO notification (user_id, type, title, message, data, read, created_at)
         VALUES ($1, 'system', 'Welcome', 'Welcome to the system', '{"test":true}', false, NOW())
         RETURNING notification_id`,
        [user.user_id]
      );
      notificationId = res.rows[0].notification_id;
    });

    it('GET /api/notifications should return the user notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].title).toBe('Welcome');
      expect(response.body.data[0].read).toBe(false);
    });

    it('GET /api/notifications/unread/count should return count > 0', async () => {
      const response = await request(app)
        .get('/api/notifications/unread/count')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(parseInt(response.body.data.count, 10)).toBe(1);
    });

    it('PUT /api/notifications/:id/read should mark notification as read', async () => {
      const response = await request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.read).toBe(true);
      expect(response.body.data.notification_id).toBe(notificationId);
    });

    it('PUT /api/notifications/read-all should mark all notifications as read', async () => {
      // Primero insertamos otra no leída
      await pool.query(
        `INSERT INTO notification (user_id, type, title, message, read, created_at)
         VALUES ($1, 'system', 'Test 2', 'Message 2', false, NOW())`,
        [user.user_id]
      );

      const response = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const countRes = await request(app)
        .get('/api/notifications/unread/count')
        .set('Authorization', `Bearer ${token}`);
      
      expect(parseInt(countRes.body.data.count, 10)).toBe(0);
    });

    it('DELETE /api/notifications/:id should delete a notification', async () => {
      const response = await request(app)
        .delete(`/api/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const checkDb = await pool.query('SELECT * FROM notification WHERE notification_id = $1', [notificationId]);
      expect(checkDb.rows.length).toBe(0);
    });
  });

  describe('Admin Broadcast Feature', () => {
    it('should fail if user is not admin', async () => {
      const response = await request(app)
        .post('/api/admin/notifications/broadcast')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userIds: [user.user_id],
          title: 'Admin msg',
          message: 'Not admin'
        });
      
      expect(response.status).toBe(403);
    });

    it('should successfully broadcast if admin', async () => {
      const response = await request(app)
        .post('/api/admin/notifications/broadcast')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userIds: [user.user_id, adminUser.user_id],
          title: 'System Alert',
          message: 'Scheduled Maintenance'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(2);

      const userNotifications = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);
      
      // Should find the "System Alert" title
      const alert = userNotifications.body.data.find(n => n.title === 'System Alert');
      expect(alert).toBeDefined();
    });
  });
});
