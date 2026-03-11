import { Router } from 'express';
import { verifyTokenMiddleware } from '../middleware/auth.middleware.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notificationController.js';

const router = Router();

// Todas las rutas de notificaciones requieren autenticación
router.use(verifyTokenMiddleware);

router.get('/', getNotifications);
router.get('/unread/count', getUnreadCount);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
