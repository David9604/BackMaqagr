/**
 * Jest Global Teardown para Tests de Integración
 * 
 * Se ejecuta UNA VEZ después de todas las suites de test.
 * Elimina la base de datos de test.
 */

import { teardownTestDB } from '../../src/config/db.test.js';

export default async function globalTeardown() {
  console.log('\n[GLOBAL TEARDOWN] Limpiando base de datos de test...');
  
  try {
    await teardownTestDB();
    console.log('[GLOBAL TEARDOWN] Limpieza completada\n');
  } catch (error) {
    console.error('[GLOBAL TEARDOWN] Error limpiando DB de test:', error.message);
    // No lanzar error en teardown para no ocultar errores de tests
  }
}
