import pkg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Asegurar que dotenv cargue desde la raíz del proyecto
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../.env');

const ASCII_TAGS = {
  success: '[== OK ==]',
  error:   '[!! ERROR !!]',
  info:    '[>> INFO <<]'
};

// Cargar .env manualmente
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error(`${ASCII_TAGS.error} Error cargando .env:`, result.error);
} else if (process.env.NODE_ENV === 'development') {
  console.log(`${ASCII_TAGS.success} Variables .env cargadas:`, Object.keys(result.parsed || {}).length);
  console.log(`${ASCII_TAGS.info} DB Config:`, {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    passwordSet: !!process.env.DB_PASS
  });
}

const { Pool } = pkg;

// Validar que las variables críticas existan
if (!process.env.DB_PASS) {
  console.error(`${ASCII_TAGS.error} CRÍTICO: DB_PASS no está definida en .env`);
  console.error(`${ASCII_TAGS.info} Variables cargadas:`, Object.keys(process.env).filter(k => k.startsWith('DB_')));
  throw new Error('DB_PASS es requerida para conectar a PostgreSQL');
}

export const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'MaqAgr',
  password: String(process.env.DB_PASS),
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

// Test connection on first query instead of on load
pool.on('connect', () => {
  console.log(`${ASCII_TAGS.success} Conectado a PostgreSQL`);
});

pool.on('error', (err) => {
  console.error(`${ASCII_TAGS.error} Error inesperado en PostgreSQL:`, err);
});