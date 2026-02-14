/**
 * Jest Global Setup para Tests de Integración
 * 
 * Se ejecuta UNA VEZ antes de todas las suites de test.
 * Crea y configura la base de datos de test.
 */

import { setupTestDB } from '../../src/config/db.test.js';

export default async function globalSetup() {
  console.log('\n[GLOBAL SETUP] Iniciando configuración de tests de integración...');
  
  try {
    await setupTestDB();
    console.log('[GLOBAL SETUP] Base de datos de test lista\n');
  } catch (error) {
    console.error('[GLOBAL SETUP] Error configurando DB de test:', error.message);
    console.error('[GLOBAL SETUP] Asegúrese de que PostgreSQL esté corriendo y las credenciales sean correctas.');
    console.error('[GLOBAL SETUP] Variables requeridas: DB_USER, DB_HOST, DB_PASS, DB_PORT');
    throw error;
  }
}
