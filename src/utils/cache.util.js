import redisClient from '../config/redis.js';
import logger from './logger.js';

export const invalidateCache = async (patterns) => {
    if (!redisClient || redisClient.status !== 'ready') return;

    const patternsArray = Array.isArray(patterns) ? patterns : [patterns];

    for (const pattern of patternsArray) {
        try {
            // Use scanStream for better performance on large datasets, 
            // but for simplicity and requirement 'redis.keys(pattern)', we can use keys if dataset is small.
            // However, keys is blocking. Let's use scan if possible, or keys if explicitly requested.
            // Requirements said: "Usa redis.keys(pattern) para encontrar keys". 
            // I will follow requirement but wrap it safely.
            // Actually, ioredis supports 'keys'.

            const keys = await redisClient.keys(`cache:${pattern}`);

            if (keys.length > 0) {
                // pipeline deletion
                const pipeline = redisClient.pipeline();
                keys.forEach((key) => pipeline.del(key));
                await pipeline.exec();
                logger.info(`Cache invalidated for pattern: ${pattern}, keys removed: ${keys.length}`);
            }
        } catch (error) {
            logger.error(`Error invalidating cache for pattern ${pattern}: ${error.message}`);
        }
    }
};
