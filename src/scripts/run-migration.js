/**
 * Run database migrations
 * Usage: node src/scripts/run-migration.js [migration_file]
 * 
 * Examples:
 *   node src/scripts/run-migration.js 001_add_user_id_to_terrain.sql
 *   node src/scripts/run-migration.js 002_clean_reset_for_unified_seed.sql
 *   node src/scripts/run-migration.js  (runs all migrations in order)
 */

import { pool } from '../config/db.js';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const migrationsDir = resolve(__dirname, '../../database/migrations');

async function runSingleMigration(client, filename) {
  const migrationPath = resolve(migrationsDir, filename);
  const sql = readFileSync(migrationPath, 'utf8');
  
  console.log(`\n🔄 Ejecutando migración: ${filename}`);
  
  await client.query(sql);
  
  console.log(`✅ Migración completada: ${filename}`);
}

async function runMigration() {
  const client = await pool.connect();
  const specificFile = process.argv[2];
  
  try {
    if (specificFile) {
      // Run specific migration
      await runSingleMigration(client, specificFile);
    } else {
      // Run all migrations in order
      const files = readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();
      
      console.log(`📋 Encontradas ${files.length} migraciones`);
      
      for (const file of files) {
        await runSingleMigration(client, file);
      }
    }
    
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('\n✅ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Proceso falló:', error);
    process.exit(1);
  });
