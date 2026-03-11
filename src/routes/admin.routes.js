import { Router } from 'express';
import redisClient from '../config/redis.js';
import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js';
import {
    getOverviewStats,
    getRecommendationStats,
    getUserStats
} from '../controllers/adminController.js';

const router = Router();

/**
 * @swagger
 * /api/admin/stats/overview:
 *   get:
 *     summary: Obtener estadísticas generales del dashboard admin
 *     description: |
 *       Retorna métricas globales del sistema para administradores.
 *       Incluye totales de usuarios, tractores, implementos, terrenos, consultas y recomendaciones,
 *       además de tendencias de consultas por día, semana y mes.
 *       La respuesta usa caché Redis con TTL de 1 hora.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas generales obtenidas exitosamente
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
 *                   example: "Estadísticas generales obtenidas exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totals:
 *                       type: object
 *                     queriesTrend:
 *                       type: object
 *                     cacheTTLSeconds:
 *                       type: integer
 *                       example: 3600
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Acceso restringido a administradores
 *       500:
 *         description: Error interno del servidor
 */
router.get('/stats/overview', verifyTokenMiddleware, requireRole('admin'), getOverviewStats);

/**
 * @swagger
 * /api/admin/stats/recommendations:
 *   get:
 *     summary: Obtener estadísticas de recomendaciones
 *     description: |
 *       Retorna distribución de recomendaciones para gráficos del dashboard admin.
 *       Incluye top 10 de tractores e implementos recomendados, distribución por tipo de terreno,
 *       distribución por rango de potencia y promedio de potencia recomendada.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de recomendaciones obtenidas exitosamente
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Acceso restringido a administradores
 *       500:
 *         description: Error interno del servidor
 */
router.get('/stats/recommendations', verifyTokenMiddleware, requireRole('admin'), getRecommendationStats);

/**
 * @swagger
 * /api/admin/stats/users:
 *   get:
 *     summary: Obtener métricas de usuarios
 *     description: |
 *       Retorna métricas de usuarios para el dashboard admin.
 *       Incluye usuarios registrados por mes, usuarios activos/inactivos,
 *       promedio de terrenos por usuario y promedio de consultas por usuario.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de usuarios obtenidas exitosamente
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Acceso restringido a administradores
 *       500:
 *         description: Error interno del servidor
 */
router.get('/stats/users', verifyTokenMiddleware, requireRole('admin'), getUserStats);

/**
 * @swagger
 * /api/admin/cache/stats:
 *   get:
 *     summary: Obtener métricas de caché Redis
 *     description: Retorna hits, misses, hit rate y latencia de Redis para uso administrativo.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Métricas de caché obtenidas exitosamente
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Acceso restringido a administradores
 *       500:
 *         description: Error interno del servidor
 */
router.get('/cache/stats', verifyTokenMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const start = Date.now();
        // Use INFO command to get stats
        const info = await redisClient.info('stats');

        // Parse info string
        const lines = info.split('\r\n');
        const stats = {};
        lines.forEach(line => {
            const parts = line.split(':');
            if (parts.length === 2) {
                stats[parts[0]] = parts[1];
            }
        });

        const hits = parseInt(stats.keyspace_hits || 0);
        const misses = parseInt(stats.keyspace_misses || 0);
        const total = hits + misses;
        const hitRate = total > 0 ? (hits / total) * 100 : 0;

        res.json({
            hits,
            misses,
            hitRate: `${hitRate.toFixed(2)}%`,
            latency: `${Date.now() - start}ms`
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cache stats', error: error.message });
    }
});

export default router;
