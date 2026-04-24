/**
 * Setup global para tests
 * Configuración de variables de entorno y mocks
 */

import { jest } from '@jest/globals';

// Variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_SALT_ROUNDS = '4'; // Menor para tests más rápidos
process.env.GCS_BUCKET_NAME = 'test-bucket-for-testing';

// Timeout gestionado por cada configuración de Jest (unit/e2e/integration)

// Mock de console.error para tests más limpios (opcional)
global.console = {
  ...console,
  error: jest.fn(), // Mock console.error
  warn: jest.fn(),  // Mock console.warn
};

// Cleanup después de cada test
afterEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  const { closeSequelize } = await import('../config/sequelize.js');
  await closeSequelize();
});
