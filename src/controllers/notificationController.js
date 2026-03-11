import Notification from '../models/Notification.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { successResponse, notFoundResponse, errorResponse } from '../utils/response.util.js';
import logger from '../utils/logger.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user?.userId || req.user?.user_id;
  const { page = 1, limit = 20, read } = req.query;

  const notifications = await Notification.findByUser(userId, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    read
  });

  return successResponse(res, notifications, 'Notificaciones obtenidas');
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user?.userId || req.user?.user_id;
  const count = await Notification.countUnread(userId);
  return successResponse(res, { count }, 'Conteo de notificaciones no leídas');
});

export const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user?.userId || req.user?.user_id;
  const { id } = req.params;

  const notification = await Notification.markAsRead(id, userId);

  if (!notification) {
    return notFoundResponse(res, 'Notificación no encontrada o no pertenece al usuario');
  }

  return successResponse(res, notification, 'Notificación marcada como leída');
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user?.userId || req.user?.user_id;
  
  const updated = await Notification.markAllAsRead(userId);
  return successResponse(res, updated, 'Todas las notificaciones marcadas como leídas');
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user?.userId || req.user?.user_id;
  const { id } = req.params;

  const notification = await Notification.delete(id, userId);

  if (!notification) {
    return notFoundResponse(res, 'Notificación no encontrada o no pertenece al usuario');
  }

  return successResponse(res, notification, 'Notificación eliminada');
});
