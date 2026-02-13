/**
 * Database Cleanup Helper
 * Proporciona funciones para limpiar datos de test de la base de datos
 */

import { pool } from '../../../config/db.js';

/**
 * Limpia todas las tablas en orden correcto (respetando foreign keys)
 * @returns {Promise<void>}
 */
export const cleanupAllTables = async () => {
  try {
    // Orden inverso a las dependencias de FK
    await pool.query('DELETE FROM query_history');
    await pool.query('DELETE FROM recommendation');
    await pool.query('DELETE FROM power_loss');
    await pool.query('DELETE FROM query');
    await pool.query('DELETE FROM implement');
    await pool.query('DELETE FROM tractor');
    await pool.query('DELETE FROM terrain');
    // No eliminamos usuarios admin permanentes, solo los de test
    await pool.query("DELETE FROM users WHERE email LIKE '%@test.com'");
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
};

/**
 * Limpia usuarios de prueba
 * @param {Array<number>} userIds - Array de user_ids a eliminar
 * @returns {Promise<void>}
 */
export const cleanupUsers = async (userIds = []) => {
  if (userIds.length === 0) return;

  try {
    await pool.query('DELETE FROM users WHERE user_id = ANY($1)', [userIds]);
  } catch (error) {
    console.error('Error cleaning up users:', error);
    throw error;
  }
};

/**
 * Limpia terrenos de prueba
 * @param {Array<number>} terrainIds - Array de terrain_ids a eliminar
 * @returns {Promise<void>}
 */
export const cleanupTerrains = async (terrainIds = []) => {
  if (terrainIds.length === 0) return;

  try {
    await pool.query('DELETE FROM terrain WHERE terrain_id = ANY($1)', [terrainIds]);
  } catch (error) {
    console.error('Error cleaning up terrains:', error);
    throw error;
  }
};

/**
 * Limpia tractores de prueba
 * @param {Array<number>} tractorIds - Array de tractor_ids a eliminar
 * @returns {Promise<void>}
 */
export const cleanupTractors = async (tractorIds = []) => {
  if (tractorIds.length === 0) return;

  try {
    await pool.query('DELETE FROM tractor WHERE tractor_id = ANY($1)', [tractorIds]);
  } catch (error) {
    console.error('Error cleaning up tractors:', error);
    throw error;
  }
};

/**
 * Limpia implementos de prueba
 * @param {Array<number>} implementIds - Array de implement_ids a eliminar
 * @returns {Promise<void>}
 */
export const cleanupImplements = async (implementIds = []) => {
  if (implementIds.length === 0) return;

  try {
    await pool.query('DELETE FROM implement WHERE implement_id = ANY($1)', [implementIds]);
  } catch (error) {
    console.error('Error cleaning up implements:', error);
    throw error;
  }
};

/**
 * Limpia cálculos de potencia de prueba
 * @param {Array<number>} calculationIds - Array de calculation_ids a eliminar
 * @returns {Promise<void>}
 */
export const cleanupCalculations = async (calculationIds = []) => {
  if (calculationIds.length === 0) return;

  try {
    await pool.query('DELETE FROM power_loss_calculations WHERE calculation_id = ANY($1)', [calculationIds]);
  } catch (error) {
    console.error('Error cleaning up calculations:', error);
    throw error;
  }
};

/**
 * Limpia recomendaciones de prueba
 * @param {Array<number>} recommendationIds - Array de recommendation_ids a eliminar
 * @returns {Promise<void>}
 */
export const cleanupRecommendations = async (recommendationIds = []) => {
  if (recommendationIds.length === 0) return;

  try {
    await pool.query('DELETE FROM recommendations WHERE recommendation_id = ANY($1)', [recommendationIds]);
  } catch (error) {
    console.error('Error cleaning up recommendations:', error);
    throw error;
  }
};

/**
 * Helper para ejecutar cleanup después de cada test
 * Uso: afterEach(() => cleanupAfterTest(testData));
 * @param {Object} testData - Objeto con arrays de IDs a limpiar
 */
export const cleanupAfterTest = async (testData = {}) => {
  const {
    userIds = [],
    terrainIds = [],
    tractorIds = [],
    implementIds = [],
    calculationIds = [],
    recommendationIds = []
  } = testData;

  // Limpiar en orden inverso a las dependencias
  await cleanupRecommendations(recommendationIds);
  await cleanupCalculations(calculationIds);
  await cleanupTerrains(terrainIds);
  await cleanupImplements(implementIds);
  await cleanupTractors(tractorIds);
  await cleanupUsers(userIds);
};

export default {
  cleanupAllTables,
  cleanupUsers,
  cleanupTerrains,
  cleanupTractors,
  cleanupImplements,
  cleanupCalculations,
  cleanupRecommendations,
  cleanupAfterTest
};
