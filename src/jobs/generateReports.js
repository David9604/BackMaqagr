import logger from '../utils/logger.js';
import { pool } from '../config/db.js';

export default async function generateReportsJob() {
  try {
    logger.info('Ejecutando job: Generación de reportes semanales.');

    // Simular un reporte estadístico semanal
    const { rows } = await pool.query(`
      SELECT COUNT(*) as queries_last_week 
      FROM query_history 
      WHERE action_date >= NOW() - INTERVAL '7 days'
    `);
    
    const count = rows[0]?.queries_last_week || 0;
    
    logger.info(`Reporte Semanal Generado: Hubo ${count} iteraciones/acciones en la plataforma la última semana. Acción grabada en logs exitosamente.`);
    // Futuro: persistir en reportes o enviar via email
    
  } catch (error) {
    logger.error('Error en job de generación de reportes', { error: error.message });
  }
}
