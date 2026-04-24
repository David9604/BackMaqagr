import { describe, test, expect, jest } from '@jest/globals';

const mockRouter = (_req, _res, next) => next?.();
const mockNoop = (_req, _res, next) => next?.();

const mockAppDependencies = () => {
  jest.unstable_mockModule('../../src/config/db.js', () => ({
    pool: {},
  }));

  jest.unstable_mockModule('../../src/config/redis.js', () => ({
    connectRedis: jest.fn(),
  }));

  jest.unstable_mockModule('../../src/routes/calculation.routes.js', () => ({ default: mockRouter }));
  jest.unstable_mockModule('../../src/routes/tractor.routes.js', () => ({ default: mockRouter }));
  jest.unstable_mockModule('../../src/routes/implement.routes.js', () => ({ default: mockRouter }));
  jest.unstable_mockModule('../../src/routes/terrain.routes.js', () => ({ default: mockRouter }));
  jest.unstable_mockModule('../../src/routes/auth.routes.js', () => ({ default: mockRouter }));
  jest.unstable_mockModule('../../src/routes/role.routes.js', () => ({ default: mockRouter }));
  jest.unstable_mockModule('../../src/routes/recommendation.routes.js', () => ({ default: mockRouter }));
  jest.unstable_mockModule('../../src/routes/export.routes.js', () => ({ default: mockRouter }));
  jest.unstable_mockModule('../../src/routes/notification.routes.js', () => ({ default: mockRouter }));
  jest.unstable_mockModule('../../src/routes/health.routes.js', () => ({ default: mockRouter }));
  jest.unstable_mockModule('../../src/routes/admin.routes.js', () => ({ default: mockRouter }));
  jest.unstable_mockModule('../../src/routes/upload.routes.js', () => ({ default: mockRouter }));

  jest.unstable_mockModule('../../src/swagger/swagger.js', () => ({
    setupSwagger: jest.fn(),
  }));

  jest.unstable_mockModule('../../src/utils/logger.js', () => ({
    default: {
      info: jest.fn(),
      requestLogger: mockNoop,
    },
  }));

  jest.unstable_mockModule('../../src/middleware/httpLogger.middleware.js', () => ({
    default: mockNoop,
  }));

  jest.unstable_mockModule('../../src/middleware/error.middleware.js', () => ({
    notFound: mockNoop,
    errorHandler: mockNoop,
    asyncHandler: mockNoop,
  }));

  jest.unstable_mockModule('../../src/middleware/security.middleware.js', () => ({
    securityHeaders: mockNoop,
  }));

  jest.unstable_mockModule('../../src/middleware/rateLimiter.middleware.js', () => ({
    apiLimiter: mockNoop,
  }));

  jest.unstable_mockModule('../../src/middleware/cors.middleware.js', () => ({
    corsMiddleware: mockNoop,
  }));

  jest.unstable_mockModule('../../src/middleware/sanitize.middleware.js', () => ({
    sanitizeInputs: mockNoop,
  }));
};

describe('app.js JWT_SECRET production enforcement', () => {
  test('throws fatal startup error in production without JWT_SECRET', async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousJwtSecret = process.env.JWT_SECRET;

    try {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = '';
      jest.resetModules();
      mockAppDependencies();

      await expect(import('../../src/app.js')).rejects.toThrow(
        'FATAL: JWT_SECRET environment variable is required in production',
      );
    } finally {
      process.env.NODE_ENV = previousNodeEnv;
      process.env.JWT_SECRET = previousJwtSecret;
    }
  });
});
