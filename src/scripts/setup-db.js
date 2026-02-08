import { pool } from '../config/db.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ASCII_ART = {
  header: '🗄️  DATABASE SETUP - MAQAGR',
  success: '✓',
  error: '✗'
};

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log(ASCII_ART.header);
    console.log(ASCII_ART.database);
    console.log('[*] Creando estructura de base de datos...\n');
    
    const schemaPath = resolve(__dirname, '../../database/schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf8');
    
    await client.query(schemaSql);
    
    console.log(ASCII_ART.success);
    console.log('[+] Tablas creadas exitosamente');
    console.log('[+] Datos de prueba insertados');
    
  } catch (error) {
    console.log(ASCII_ART.error);
    console.error('[!] Error configurando DB:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase();
