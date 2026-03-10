import { Router } from 'express';
import redisClient from '../config/redis.js';
import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js';
import {
    getOverviewStats,
    getRecommendationStats,
    getUserStats
} from '../controllers/adminController.js';

const router = Router();

router.get('/stats/overview', verifyTokenMiddleware, requireRole('admin'), getOverviewStats);
router.get('/stats/recommendations', verifyTokenMiddleware, requireRole('admin'), getRecommendationStats);
router.get('/stats/users', verifyTokenMiddleware, requireRole('admin'), getUserStats);

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
