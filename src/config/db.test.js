/**
 * Configuración de Base de Datos para Tests de Integración
 * 
 * Proporciona conexión a una DB separada y funciones de setup/teardown
 * para garantizar aislamiento entre suites de test.
 */

import pkg from 'pg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const { Pool, Client } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de .env desde la raíz del proyecto
const envPath = resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Configuración de la base de datos de test (usa credenciales de .env)
const TEST_DB_CONFIG = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  password: process.env.DB_PASS,
  port: parseInt(process.env.DB_PORT || '5432', 10),
};

const TEST_DB_NAME = process.env.TEST_DB_NAME || 'maqagr_test';

/**
 * Crea la base de datos de test si no existe
 */
export async function createTestDatabase() {
  const client = new Client({
    ...TEST_DB_CONFIG,
    database: 'postgres', // Conectar a DB por defecto para crear la de test
  });

  try {
    await client.connect();

    // Verificar si la DB de test existe
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [TEST_DB_NAME]
    );

    if (result.rows.length === 0) {
      // Terminar conexiones existentes a la DB de test
      await client.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '${TEST_DB_NAME}'
        AND pid <> pg_backend_pid()
      `);

      await client.query(`CREATE DATABASE "${TEST_DB_NAME}"`);
      console.log(`[TEST DB] Base de datos "${TEST_DB_NAME}" creada exitosamente`);
    } else {
      console.log(`[TEST DB] Base de datos "${TEST_DB_NAME}" ya existe`);
    }
  } finally {
    await client.end();
  }
}

/**
 * Aplica el esquema SQL a la base de datos de test
 */
export async function applySchema() {
  const pool = new Pool({
    ...TEST_DB_CONFIG,
    database: TEST_DB_NAME,
  });

  try {
    const schemaPath = resolve(__dirname, '../../database/schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    await pool.query(schema);
    console.log('[TEST DB] Esquema aplicado exitosamente');
  } finally {
    await pool.end();
  }
}

/**
 * Configura la base de datos de test completa (crear + schema)
 * Se ejecuta en globalSetup de Jest
 */
export async function setupTestDB() {
  await createTestDatabase();
  await applySchema();
  console.log('[TEST DB] Setup completo');
}

/**
 * Limpia TODOS los datos de las tablas (preservando el schema)
 * Se ejecuta entre suites de test para aislamiento
 * @param {import('pg').Pool} pool - Pool de conexión a usar
 */
export async function cleanTestDB(pool) {
  const tables = [
    'query_history',
    'power_loss',
    'recommendation',
    'query',
    'implement',
    'tractor',
    'terrain',
    'users',
    'role',
  ];

  // Usar TRUNCATE CASCADE para limpiar en orden correcto
  await pool.query(`TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE`);
}

/**
 * Inserta datos semilla necesarios para los tests
 * @param {import('pg').Pool} pool - Pool de conexión a usar
 */
export async function seedTestDB(pool) {
  // Insertar roles necesarios
  await pool.query(`
    INSERT INTO role (role_name, description) VALUES
    ('admin', 'System administrator with all permissions'),
    ('user', 'Standard user with basic permissions'),
    ('operator', 'Operator with query and calculation permissions')
    ON CONFLICT (role_name) DO NOTHING
  `);

  // Insertar tractores de prueba
  await pool.query(`
    INSERT INTO tractor (name, brand, model, engine_power_hp, weight_kg, traction_force_kn, traction_type, tire_type, status) VALUES
    ('John Deere 5075E', 'John Deere', '5075E', 75, 3200, 45, '4x4', 'Radial 16.9R30', 'available'),
    ('Massey Ferguson 4709', 'Massey Ferguson', '4709', 90, 3500, 52, '4x4', 'Radial 18.4R34', 'available'),
    ('New Holland TT3.55', 'New Holland', 'TT3.55', 55, 2800, 38, '4x2', 'Diagonal 14.9-28', 'available')
  `);

  // Insertar implementos de prueba
  await pool.query(`
    INSERT INTO implement (implement_name, brand, power_requirement_hp, working_width_m, soil_type, implement_type, status) VALUES
    ('3-body disc plow', 'Baldan', 50, 0.9, 'Loam', 'plow', 'available'),
    ('20-disc harrow', 'Tatu', 35, 1.8, 'All', 'harrow', 'available'),
    ('5-row seeder', 'Semeato', 40, 1.5, 'Loam', 'seeder', 'available')
  `);
}

/**
 * Destruye la base de datos de test completamente
 * Se ejecuta en globalTeardown de Jest
 */
export async function teardownTestDB() {
  const client = new Client({
    ...TEST_DB_CONFIG,
    database: 'postgres',
  });

  try {
    await client.connect();

    // Terminar todas las conexiones a la DB de test
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${TEST_DB_NAME}'
      AND pid <> pg_backend_pid()
    `);

    await client.query(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}"`);
    console.log(`[TEST DB] Base de datos "${TEST_DB_NAME}" eliminada`);
  } finally {
    await client.end();
  }
}

/**
 * Crea un pool de conexión para la base de datos de test
 * @returns {import('pg').Pool}
 */
export function createTestPool() {
  return new Pool({
    ...TEST_DB_CONFIG,
    database: TEST_DB_NAME,
  });
}

export default {
  setupTestDB,
  teardownTestDB,
  cleanTestDB,
  seedTestDB,
  createTestPool,
  createTestDatabase,
  applySchema,
  TEST_DB_NAME,
};
