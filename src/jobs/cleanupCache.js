import redisClient from '../config/redis.js';
import logger from '../utils/logger.js';

export default async function cleanupCacheJob() {
  try {
    logger.info('Ejecutando job: Limpieza de caché (Redis).');

    if (!redisClient || redisClient.status !== 'ready') {
      logger.warn('Redis no está listo, se aborta la limpieza de caché.');
      return;
    }

    // Buscar configuraciones o datos viejos. Redundancia de limpieza de memory cache.
    // Nota: ioredis iterar sobre `scanStream`.
    let cursor = '0';
    let deletedCount = 0;

    do {
      // Escanear llaves de cache con patrón 'cache:*'
      const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', 'cache:*', 'COUNT', 100);
      cursor = nextCursor;

      if (keys.length > 0) {
        for (const key of keys) {
          const ttl = await redisClient.ttl(key);
          // Si ttl === -1, la clave no tiene tiempo de expiración
          // Si es temporal por error, la limpiamos. (Regla de negocio simple)
          if (ttl === -1) {
            await redisClient.del(key);
            deletedCount++;
          }
        }
      }
    } while (cursor !== '0');

    logger.info(`Limpieza de caché finalizada. Claves eliminadas (sin TTL): ${deletedCount}`);
    
  } catch (error) {
    logger.error('Error en job de limpieza de caché', { error: error.message });
  }
}
