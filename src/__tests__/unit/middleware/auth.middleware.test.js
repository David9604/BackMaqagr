/**
 * Tests para auth.middleware.js
 * Cobertura: verifyTokenMiddleware, isAdmin, isAuthenticated
 */

import { jest } from '@jest/globals';

// Crear mock manual para jwt.util
const mockVerifyToken = jest.fn();

// Mock del módulo jwt.util antes de importar
jest.unstable_mockModule('../../../utils/jwt.util.js', () => ({
  verifyToken: mockVerifyToken
}));

// Importar el middleware después del mock
const { verifyTokenMiddleware, isAdmin, isAuthenticated } = await import('../../../middleware/auth.middleware.js');

describe('auth.middleware.js', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Mock de request
    mockReq = {
      headers: {},
      user: null
    };

    // Mock de response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Mock de next
    mockNext = jest.fn();

    // Limpiar mocks
    jest.clearAllMocks();
  });

  describe('verifyTokenMiddleware', () => {
    test('debe agregar datos del usuario a req.user cuando el token es válido', () => {
      // Arrange
      const token = 'valid.jwt.token';
      const decodedUser = {
        user_id: 1,
        username: 'testuser',
        email: 'test@test.com',
        role_id: 2
      };

      mockReq.headers['authorization'] = `Bearer ${token}`;
      mockVerifyToken.mockReturnValue(decodedUser);

      // Act
      verifyTokenMiddleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockVerifyToken).toHaveBeenCalledWith(token);
      expect(mockReq.user).toEqual(decodedUser);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('debe retornar 401 cuando no se proporciona header Authorization', () => {
      // Arrange: No header

      // Act
      verifyTokenMiddleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token no proporcionado'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('debe retornar 401 cuando el formato del token es inválido (sin Bearer)', () => {
      // Arrange
      mockReq.headers['authorization'] = 'InvalidFormatToken';

      // Act
      verifyTokenMiddleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Formato de token inválido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('debe retornar 401 cuando el token está vacío después de Bearer', () => {
      // Arrange
      mockReq.headers['authorization'] = 'Bearer ';

      // Act
      verifyTokenMiddleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Formato de token inválido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('debe retornar 401 cuando el token es inválido (verifyToken lanza error)', () => {
      // Arrange
      const token = 'invalid.jwt.token';
      mockReq.headers['authorization'] = `Bearer ${token}`;
      mockVerifyToken.mockImplementation(() => {
        throw new Error('Token inválido');
      });

      // Act
      verifyTokenMiddleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockVerifyToken).toHaveBeenCalledWith(token);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token inválido o expirado'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('debe retornar 401 cuando el token está expirado', () => {
      // Arrange
      const token = 'expired.jwt.token';
      mockReq.headers['authorization'] = `Bearer ${token}`;
      const error = new Error('Token expirado');
      error.name = 'TokenExpiredError';
      mockVerifyToken.mockImplementation(() => {
        throw error;
      });

      // Act
      verifyTokenMiddleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockVerifyToken).toHaveBeenCalledWith(token);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token inválido o expirado'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('isAdmin', () => {
    test('debe llamar next() cuando el usuario es administrador (role_id = 1)', () => {
      // Arrange
      mockReq.user = {
        user_id: 1,
        username: 'admin',
        role_id: 1
      };

      // Act
      isAdmin(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('debe retornar 403 cuando el usuario no es administrador (role_id = 2)', () => {
      // Arrange
      mockReq.user = {
        user_id: 2,
        username: 'normaluser',
        role_id: 2
      };

      // Act
      isAdmin(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Acceso denegado: se requiere rol de administrador'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('debe retornar 401 cuando no hay usuario autenticado (req.user no existe)', () => {
      // Arrange: mockReq.user = null por defecto

      // Act
      isAdmin(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'No autenticado'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('debe retornar 403 cuando role_id es 0 (super admin pero no 1)', () => {
      // Arrange
      mockReq.user = {
        user_id: 99,
        username: 'superadmin',
        role_id: 0
      };

      // Act
      isAdmin(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Acceso denegado: se requiere rol de administrador'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('isAuthenticated', () => {
    test('debe funcionar como alias de verifyTokenMiddleware', () => {
      // Arrange
      const token = 'valid.jwt.token';
      const decodedUser = {
        user_id: 1,
        username: 'testuser',
        email: 'test@test.com',
        role_id: 2
      };

      mockReq.headers['authorization'] = `Bearer ${token}`;
      mockVerifyToken.mockReturnValue(decodedUser);

      // Act
      isAuthenticated(mockReq, mockRes, mockNext);

      // Assert
      expect(mockVerifyToken).toHaveBeenCalledWith(token);
      expect(mockReq.user).toEqual(decodedUser);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('debe retornar 401 cuando no hay token (comportamiento igual a verifyTokenMiddleware)', () => {
      // Arrange: No header

      // Act
      isAuthenticated(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token no proporcionado'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
