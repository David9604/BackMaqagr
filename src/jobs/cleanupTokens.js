import logger from '../utils/logger.js';

export default async function cleanupTokensJob() {
  try {
    logger.info('Ejecutando job: Limpieza de tokens expirados.');
    
    // El ecosistema actual confía en la expiración criptográfica de JWT.
    // No hay tabla en DB. Simplemente registramos la ejecución.
    logger.info('Limpieza de tokens finalizada (Manejado vía expiración JWT).');
    
  } catch (error) {
    logger.error('Error en job de limpieza de tokens', { error: error.message });
  }
}
