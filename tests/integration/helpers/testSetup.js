/**
 * Test Setup para Tests de Integración
 * 
 * Configura variables de entorno y helpers comunes
 * Se ejecuta antes de cada suite de test (setupFilesAfterEnv)
 */

import { jest } from '@jest/globals';

// ============================================
// VARIABLES DE ENTORNO PARA TESTING
// ============================================
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-integration-tests';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_SALT_ROUNDS = '4';

// Cargar variables de .env del proyecto
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

// Configurar DB de test (sobreescribir DB_NAME para apuntar a la de test)
process.env.DB_NAME = process.env.TEST_DB_NAME || 'maqagr_test';

// Timeout más amplio para operaciones de DB
jest.setTimeout(30000);

// Cleanup después de cada test
afterEach(() => {
  jest.restoreAllMocks();
});
