import { afterEach, describe, expect, jest, test } from '@jest/globals';

const originalNodeEnv = process.env.NODE_ENV;

const loadLoggerForEnv = async (nodeEnv) => {
  process.env.NODE_ENV = nodeEnv;
  jest.resetModules();
  const loggerModule = await import('../../../src/config/logger.js');
  return loggerModule.default;
};

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  jest.resetModules();
});

describe('config/logger transport selection', () => {
  test('in test env configures one silent console transport and no file transports', async () => {
    const logger = await loadLoggerForEnv('test');

    expect(logger.transports).toHaveLength(1);
    expect(logger.transports[0].constructor.name).toBe('Console');
    expect(logger.transports[0].silent).toBe(true);
    expect(logger.transports.some((transport) => transport.constructor.name === 'File')).toBe(false);
    expect(logger.transports.some((transport) => transport.constructor.name === 'DailyRotateFile')).toBe(false);
  });

  test('in development env preserves console and file transports', async () => {
    const logger = await loadLoggerForEnv('development');

    expect(logger.transports.some((transport) => transport.constructor.name === 'Console')).toBe(true);
    expect(logger.transports.some((transport) => transport.constructor.name === 'File')).toBe(true);
    expect(logger.transports.some((transport) => transport.constructor.name === 'DailyRotateFile')).toBe(true);
  });

  test('in production env keeps console transport non-silent with warn level', async () => {
    const logger = await loadLoggerForEnv('production');
    const consoleTransport = logger.transports.find((transport) => transport.constructor.name === 'Console');

    expect(consoleTransport).toBeDefined();
    expect(consoleTransport.silent).not.toBe(true);
    expect(consoleTransport.level).toBe('warn');
    expect(logger.transports.some((transport) => transport.constructor.name === 'File')).toBe(true);
    expect(logger.transports.some((transport) => transport.constructor.name === 'DailyRotateFile')).toBe(true);
  });
});
