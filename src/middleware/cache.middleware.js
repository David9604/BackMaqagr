import redisClient from '../config/redis.js';
import logger from '../utils/logger.js';
import { invalidateCache } from '../utils/cache.util.js';

export const cacheMiddleware = (ttlSeconds) => {
    return async (req, res, next) => {
        // Skip caching for non-GET requests (safety check)
        if (req.method !== 'GET') {
            return next();
        }

        const userId = req.user ? `:${req.user.id}` : '';
        const key = `cache:${req.originalUrl || req.url}${userId}`;

        try {
            const cachedData = await redisClient.get(key);

            if (cachedData) {
                logger.info(`Cache HIT for ${key}`);
                res.setHeader('X-Cache', 'HIT');
                return res.json(JSON.parse(cachedData));
            }

            logger.info(`Cache MISS for ${key}`);
            res.setHeader('X-Cache', 'MISS');

            // Intercept res.json to cache the response
            const originalJson = res.json;
            res.json = (body) => {
                // Restore original json function to avoid infinite loop or conflicts
                res.json = originalJson;

                // Save to Redis asynchronously (non-blocking)
                redisClient.set(key, JSON.stringify(body), 'EX', ttlSeconds).catch((err) => {
                    logger.error(`Redis cache save error: ${err.message}`);
                });

                // Send response
                return originalJson.call(res, body);
            };

            next();
        } catch (error) {
            logger.error(`Redis cache error: ${error.message}`);
            // Fallback: execute handler without caching
            next();
        }
    };
};

export const invalidateCacheMiddleware = (patterns) => {
    return (req, res, next) => {
        res.on('finish', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                invalidateCache(patterns);
            }
        });
        next();
    };
};
