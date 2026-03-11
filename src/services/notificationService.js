import Notification from '../models/Notification.js';
import logger from '../utils/logger.js';
import { pool } from '../config/db.js';

export const NOTIFICATION_TYPES = {
  RECOMMENDATION: 'recommendation',
  TRACTOR_AVAILABLE: 'tractor_available',
  SYSTEM: 'system',
};

/**
 * Crea una notificación general (Silencioso en caso de error para no bloquear procesos)
 */
export async function createNotification(userId, type, title, message, data = null) {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data,
    });
    
    logger.info('Notificación creada', {
      userId,
      type,
      notificationId: notification.notification_id,
    });
    
    return notification;
  } catch (error) {
    logger.error('Error creando notificación', {
      userId,
      type,
      error: error.message,
    });
    return null;
  }
}

/**
 * Notificación específica para nueva recomendación
 */
export async function notifyRecommendationCreated(userId, recommendationId) {
  return createNotification(
    userId,
    NOTIFICATION_TYPES.RECOMMENDATION,
    'Nueva recomendación disponible',
    `Se generó una nueva recomendación de tractor y/o implemento (Query ID: ${recommendationId})`,
    { recommendationId }
  );
}

/**
 * Notificación específica para tractor disponible (Admin dashboard, etc)
 */
export async function notifyTractorAvailable(userId, tractorId, tractorName) {
  return createNotification(
    userId,
    NOTIFICATION_TYPES.TRACTOR_AVAILABLE,
    'Tractor disponible',
    `El tractor ${tractorName} ahora se encuentra disponible.`,
    { tractorId }
  );
}

/**
 * Enviar notificaciones a múltiples usuarios (Batch insert for performance)
 */
export async function notifySystemMaintenance(userIds, title, message) {
  if (!userIds || userIds.length === 0) return 0;
  
  try {
    const valuesPart = userIds.map((id, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4}, false, NOW())`).join(',');
    
    // Flat mapping array [id1, type, title, msg, id2, type, title, msg, ...]
    const flatParams = userIds.flatMap(id => [id, NOTIFICATION_TYPES.SYSTEM, title, message]);

    const { rowCount } = await pool.query(
      `INSERT INTO notification (user_id, type, title, message, read, created_at) VALUES ${valuesPart}`,
      flatParams
    );
    
    logger.info(`Notificación de sistema enviada masivamente a ${rowCount} usuarios`);
    return rowCount;
  } catch (error) {
    logger.error('Error en envío masivo de notificaciones', {
      userCount: userIds.length,
      error: error.message,
    });
    return 0;
  }
}

/**
 * Lógica simple de notificación ante nuevos tractores potentes
 */
export async function notifyUsersAboutNewTractor(tractor) {
  if (tractor.engine_power_hp >= 90) {
    try {
      const { rows } = await pool.query(`
        SELECT DISTINCT u.user_id 
        FROM users u
        JOIN terrain t ON u.user_id = t.user_id
        WHERE u.status = 'active' AND t.status = 'active'
      `);
      
      const userIds = rows.map(r => r.user_id);
      
      for(const id of userIds) {
        await notifyTractorAvailable(id, tractor.tractor_id || tractor.id, tractor.name);
      }
      
      logger.info(`Notificaciones por nuevo tractor enviadas a ${userIds.length} usuarios.`);
    } catch (error) {
      logger.error('Error evaluando usuarios para notificar sobre tractor', { error: error.message });
    }
  }
}

