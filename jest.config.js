/**
 * Jest Configuration
 * Testing setup para ES Modules
 */

export default {
  // Usar node como entorno de test
  testEnvironment: 'node',
  
  // Patrón de archivos de test
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Directorios a ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/testing/.*\\.test\\.js$'  // Excluir tests legacy (standalone scripts con process.exit)
    '/tests/integration/'
  ],
  
  // Coverage
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/scripts/**',
    '!src/test-*.js',
    '!**/node_modules/**'
  ],
  
  // Umbral de cobertura (objetivo: 60%)
  /* 
  * NOTA: Con los nuevos tests implementados (DDAAM-80), la cobertura
  * de middleware y utils debe ser >85%
  */
  coverageThreshold: {
    global: {
      statements: 60,
      branches: 50,
      functions: 60,
      lines: 60
    }
  },
  
  // Transformaciones (necesario para ES Modules)
  transform: {},
  
  // Timeout para tests (útil para tests de DB)
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js']
};
