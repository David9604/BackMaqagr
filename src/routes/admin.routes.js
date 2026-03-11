import { Router } from 'express';
import redisClient from '../config/redis.js';
import { verifyTokenMiddleware, isAdmin } from '../middleware/auth.middleware.js';
import { notifySystemMaintenance } from '../services/notificationService.js';
import { successResponse } from '../utils/response.util.js';

const router = Router();

router.get('/cache/stats', verifyTokenMiddleware, isAdmin, async (req, res) => {
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

router.post('/notifications/broadcast', verifyTokenMiddleware, isAdmin, async (req, res) => {
    try {
        const { userIds, title, message } = req.body;
        
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: 'Se requiere un array de userIds' });
        }

        if (!title || !message) {
            return res.status(400).json({ message: 'El título y el mensaje son requeridos' });
        }

        const count = await notifySystemMaintenance(userIds, title, message);
        
        return successResponse(res, { count }, `Notificación enviada a ${count} usuarios`);
    } catch (error) {
        res.status(500).json({ message: 'Error enviando notificaciones masivas', error: error.message });
    }
});

export default router;
