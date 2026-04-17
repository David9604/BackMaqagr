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

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Obtener notificaciones del usuario
 *     description: |
 *       Retorna las notificaciones del usuario autenticado con paginación.
 *       Soporta filtrado por estado de lectura (?read=true o ?read=false).
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Registros por página
 *       - in: query
 *         name: read
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filtrar por estado de lectura
 *     responses:
 *       200:
 *         description: Notificaciones obtenidas exitosamente
 *       401:
 *         description: Token no proporcionado o inválido
 */
router.get('/', getNotifications);

/**
 * @swagger
 * /api/notifications/unread/count:
 *   get:
 *     summary: Contar notificaciones no leídas
 *     description: Retorna la cantidad de notificaciones pendientes de lectura del usuario autenticado.
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Conteo obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Conteo de notificaciones no leídas"
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Token no proporcionado o inválido
 */
router.get('/unread/count', getUnreadCount);

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Marcar todas las notificaciones como leídas
 *     description: Marca todas las notificaciones del usuario autenticado como leídas.
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Todas las notificaciones marcadas como leídas
 *       401:
 *         description: Token no proporcionado o inválido
 */
router.put('/read-all', markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Marcar una notificación como leída
 *     description: Marca una notificación específica como leída. Solo el propietario puede hacerlo.
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la notificación
 *     responses:
 *       200:
 *         description: Notificación marcada como leída
 *       401:
 *         description: Token no proporcionado o inválido
 *       404:
 *         description: Notificación no encontrada o no pertenece al usuario
 */
router.put('/:id/read', markAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Eliminar una notificación
 *     description: Elimina una notificación específica. Solo el propietario puede hacerlo.
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la notificación
 *     responses:
 *       200:
 *         description: Notificación eliminada exitosamente
 *       401:
 *         description: Token no proporcionado o inválido
 *       404:
 *         description: Notificación no encontrada o no pertenece al usuario
 */
router.delete('/:id', deleteNotification);

export default router;
