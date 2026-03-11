import cron from 'node-cron';
import logger from '../utils/logger.js';
import cleanupTokensJob from './cleanupTokens.js';
import cleanupCacheJob from './cleanupCache.js';
import generateReportsJob from './generateReports.js';

export function initJobs() {
  logger.info('Iniciando tareas programadas (Background Jobs)...');
  
  // Job: Cleanup de tokens expirados (Diario a las 2 AM)
  cron.schedule('0 2 * * *', cleanupTokensJob);

  // Job: Limpieza de caché antigua (Diario a las 3 AM)
  cron.schedule('0 3 * * *', cleanupCacheJob);

  // Job: Generación de reportes (Semanal: Lunes a la 1 AM)
  cron.schedule('0 1 * * 1', generateReportsJob);
}
