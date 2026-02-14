/**
 * Jest Configuration - Tests de Integración
 * 
 * Configuración separada para tests de integración que requieren
 * conexión a base de datos real (PostgreSQL).
 * 
 * Ejecutar con: npm run test:integration
 */

export default {
  // Entorno Node.js
  testEnvironment: 'node',

  // Solo tests de integración
  testMatch: [
    '<rootDir>/tests/integration/**/*.test.js',
  ],

  // Ignorar directorios
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
  ],

  // Setup/Teardown global (crear/destruir DB de test)
  globalSetup: '<rootDir>/tests/integration/globalSetup.js',
  globalTeardown: '<rootDir>/tests/integration/globalTeardown.js',

  // Setup por suite (variables de entorno y helpers)
  setupFilesAfterEnv: ['<rootDir>/tests/integration/helpers/testSetup.js'],

  // Coverage para tests de integración
  collectCoverageFrom: [
    'src/controllers/**/*.js',
    'src/services/**/*.js',
    'src/middleware/**/*.js',
    'src/models/**/*.js',
    'src/utils/**/*.js',
    '!src/app.js',
    '!src/scripts/**',
    '!**/node_modules/**',
  ],

  // Umbral de cobertura de integración (objetivo: 25%)
  coverageThreshold: {
    global: {
      statements: 25,
      branches: 15,
      functions: 25,
      lines: 25,
    },
  },

  // Sin transformaciones (ES Modules nativo)
  transform: {},

  // Timeout amplio para operaciones con DB
  testTimeout: 30000,

  // Verbose para ver cada test individual
  verbose: true,

  // Ejecutar tests en serie (evitar conflictos de DB)
  maxWorkers: 1,
};
