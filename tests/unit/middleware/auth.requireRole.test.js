import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const mockVerifyToken = jest.fn();

jest.unstable_mockModule('../../../src/utils/jwt.util.js', () => ({
  __esModule: true,
  verifyToken: mockVerifyToken,
}));

const { requireRole } = await import('../../../src/middleware/auth.middleware.js');

const createMockRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe('auth.middleware requireRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('retorna 500 cuando la configuración de roles es inválida', () => {
    const middleware = requireRole(['unknown-role']);
    const req = {
      user: { role_id: 1 },
    };
    const res = createMockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Configuración de roles inválida',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('permite acceso cuando alguno de los roles requeridos coincide', () => {
    const middleware = requireRole(['admin', 3]);
    const req = {
      user: { role_id: 3 },
    };
    const res = createMockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('retorna 403 con labels normalizados cuando el rol no coincide', () => {
    const middleware = requireRole(['admin', 'operator']);
    const req = {
      user: { role_id: 2 },
    };
    const res = createMockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      code: 'FORBIDDEN',
      message: 'Acceso denegado: se requiere rol de administrador o operator',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
