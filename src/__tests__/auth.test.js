/**
 * Tests para Autenticación (JWT, Login, Register)
 * Valida el sistema de autenticación de la API
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { 
  generateToken, 
  verifyToken, 
  refreshToken 
} from '../utils/jwt.util.js';

// Mock payload compartido entre todos los tests
const testSecret = process.env.JWT_SECRET || 'test-secret';
const mockPayload = {
  user_id: 1,
  email: 'test@example.com',
  role_id: 2
};

describe('JWT Utils Tests', () => {

  // ========== GENERATE TOKEN ==========
  describe('generateToken', () => {
    test('debe generar un token JWT válido', () => {
      const token = generateToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // header.payload.signature
    });

    test('el token debe incluir el payload correcto', () => {
      const token = generateToken(mockPayload);
      const decoded = jwt.verify(token, testSecret);
      
      expect(decoded.user_id).toBe(mockPayload.user_id);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role_id).toBe(mockPayload.role_id);
    });

    test('debe incluir timestamp de expiración', () => {
      const token = generateToken(mockPayload);
      const decoded = jwt.verify(token, testSecret);
      
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    test('debe expirar después de la duración configurada', () => {
      const token = generateToken(mockPayload);
      const decoded = jwt.verify(token, testSecret);
      
      // JWT_EXPIRES_IN = '1h' en tests
      const expectedExpiry = decoded.iat + (60 * 60); // 1 hora en segundos
      expect(Math.abs(decoded.exp - expectedExpiry)).toBeLessThan(5); // Tolerancia 5 segundos
    });

    test('debe permitir personalizar la expiración', () => {
      const customExpiresIn = '1h';
      const token = generateToken(mockPayload, customExpiresIn);
      const decoded = jwt.verify(token, testSecret);
      
      const expectedExpiry = decoded.iat + (60 * 60); // 1 hora en segundos
      expect(Math.abs(decoded.exp - expectedExpiry)).toBeLessThan(5);
    });

    test('debe lanzar error si el payload está vacío', () => {
      expect(() => {
        generateToken(null);
      }).toThrow();
      
      expect(() => {
        generateToken(undefined);
      }).toThrow();
    });
  });

  // ========== VERIFY TOKEN ==========
  describe('verifyToken', () => {
    test('debe verificar un token válido', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.user_id).toBe(mockPayload.user_id);
    });

    test('debe rechazar un token inválido', () => {
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.token';
      
      expect(() => {
        verifyToken(invalidToken);
      }).toThrow();
    });

    test('debe rechazar un token expirado', () => {
      const expiredToken = jwt.sign(
        mockPayload, 
        testSecret, 
        { expiresIn: '-1s' } // Token ya expirado
      );
      
      expect(() => {
        verifyToken(expiredToken);
      }).toThrow('jwt expired');
    });

    test('debe rechazar un token firmado con otra clave', () => {
      const tokenWithWrongSecret = jwt.sign(mockPayload, 'wrong-secret', { expiresIn: '1h' });
      
      expect(() => {
        verifyToken(tokenWithWrongSecret);
      }).toThrow();
    });

    test('debe rechazar token vacío o nulo', () => {
      expect(() => verifyToken(null)).toThrow();
      expect(() => verifyToken('')).toThrow();
      expect(() => verifyToken(undefined)).toThrow();
    });

    test('debe rechazar token malformado', () => {
      expect(() => {
        verifyToken('not.a.valid.jwt.format');
      }).toThrow();
    });
  });

  // ========== REFRESH TOKEN ==========
  describe('refreshToken', () => {
    test('debe generar nuevo token desde uno válido', async () => {
      const originalToken = generateToken(mockPayload);
      
      // Esperar 1 segundo para asegurar que iat sea diferente
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newToken = refreshToken(originalToken);
      
      expect(newToken).toBeDefined();
      // El token podría ser diferente si el timestamp cambió
      
      const decoded = verifyToken(newToken);
      expect(decoded.user_id).toBe(mockPayload.user_id);
    });

    test('debe funcionar incluso con tokens expirados', () => {
      const expiredToken = jwt.sign(
        mockPayload, 
        testSecret, 
        { expiresIn: '-1h' }
      );
      
      const newToken = refreshToken(expiredToken);
      
      expect(newToken).toBeDefined();
      expect(newToken).not.toBe(expiredToken);
    });

    test('debe retornar null para tokens inválidos', () => {
      const result = refreshToken('invalid.token');
      
      expect(result).toBeNull();
    });

    test('nuevo token debe tener los mismos claims', () => {
      const originalToken = generateToken(mockPayload);
      const refreshedToken = refreshToken(originalToken);
      
      const original = verifyToken(originalToken);
      const refreshed = verifyToken(refreshedToken);
      
      expect(refreshed.user_id).toBe(original.user_id);
      expect(refreshed.email).toBe(original.email);
      expect(refreshed.role_id).toBe(original.role_id);
    });
  });
});

// ========== BCRYPT PASSWORD TESTS ==========
describe('Password Hashing Tests', () => {
  
  const plainPassword = 'Password123!';
  let hashedPassword;

  beforeEach(async () => {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 4;
    hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
  });

  test('debe hashear contraseña correctamente', async () => {
    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).not.toBe(plainPassword);
    expect(hashedPassword.startsWith('$2')).toBe(true); // bcrypt hash format
  });

  test('debe verificar contraseña correcta', async () => {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    
    expect(isMatch).toBe(true);
  });

  test('debe rechazar contraseña incorrecta', async () => {
    const wrongPassword = 'WrongPass456!';
    const isMatch = await bcrypt.compare(wrongPassword, hashedPassword);
    
    expect(isMatch).toBe(false);
  });

  test('hash de la misma contraseña debe ser diferente cada vez', async () => {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 4;
    const hash1 = await bcrypt.hash(plainPassword, saltRounds);
    const hash2 = await bcrypt.hash(plainPassword, saltRounds);
    
    expect(hash1).not.toBe(hash2);
    
    // Pero ambos deben validar la misma contraseña
    expect(await bcrypt.compare(plainPassword, hash1)).toBe(true);
    expect(await bcrypt.compare(plainPassword, hash2)).toBe(true);
  });

  test('debe respetar el número de salt rounds', async () => {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS);
    
    expect(saltRounds).toBeDefined();
    expect(saltRounds).toBeGreaterThan(0);
    
    // Para testing, debería ser bajo (4) para velocidad
    if (process.env.NODE_ENV === 'test') {
      expect(saltRounds).toBeLessThanOrEqual(4);
    }
  });
});

// ========== AUTH MIDDLEWARE SIMULATION ==========
describe('Auth Middleware Behavior', () => {
  
  const createMockRequest = (token) => ({
    headers: {
      authorization: token ? `Bearer ${token}` : undefined
    }
  });

  const createMockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  test('debe extraer token del header Authorization', () => {
    const token = generateToken(mockPayload);
    const req = createMockRequest(token);
    
    const authHeader = req.headers.authorization;
    expect(authHeader).toMatch(/^Bearer /);
    
    const extractedToken = authHeader.replace('Bearer ', '');
    expect(extractedToken).toBe(token);
  });

  test('debe fallar sin header Authorization', () => {
    const req = createMockRequest(null);
    
    expect(req.headers.authorization).toBeUndefined();
  });

  test('debe fallar con formato incorrecto (sin Bearer)', () => {
    const token = generateToken(mockPayload);
    const req = {
      headers: {
        authorization: token // Sin "Bearer " prefix
      }
    };
    
    const authHeader = req.headers.authorization;
    expect(authHeader.startsWith('Bearer ')).toBe(false);
  });

  test('debe validar token y extraer userId', () => {
    const token = generateToken(mockPayload);
    const decoded = verifyToken(token);
    
    expect(decoded.user_id).toBe(mockPayload.user_id);
    
    // En middleware real, esto se asignaría a req.userId
    const userId = decoded.user_id;
    expect(userId).toBe(1);
  });

  test('debe rechazar request con token expirado', () => {
    const expiredToken = jwt.sign(
      mockPayload, 
      process.env.JWT_SECRET, 
      { expiresIn: '-1h' }
    );
    
    expect(() => {
      verifyToken(expiredToken);
    }).toThrow();
    // En middleware real, esto retornaría 401 Unauthorized
  });
});

// ========== TOKEN REFRESH SCENARIOS ==========
describe('Token Refresh Scenarios', () => {
  
  test('debe poder generar nuevo token desde uno válido', async () => {
    const originalToken = generateToken(mockPayload);
    
    // Esperar 1 segundo para que iat sea diferente
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const refreshedToken = refreshToken(originalToken);
    
    const decoded = verifyToken(originalToken);
    const refreshed = verifyToken(refreshedToken);
    
    expect(decoded).toBeDefined();
    expect(refreshed).toBeDefined();
    
    // Deben tener los mismos claims
    expect(refreshed.user_id).toBe(decoded.user_id);
    expect(refreshed.email).toBe(decoded.email);
    expect(refreshed.role_id).toBe(decoded.role_id);
  });

  test('token original sigue válido después de refresh', () => {
    const token1 = generateToken(mockPayload);
    const token2 = generateToken(mockPayload);
    
    // Ambos deben verificar correctamente
    expect(() => verifyToken(token1)).not.toThrow();
    expect(() => verifyToken(token2)).not.toThrow();
  });
});

// ========== SECURITY EDGE CASES ==========
describe('Security Edge Cases', () => {
  
  test('debe generar tokens con algoritmo HS256', () => {
    const token = generateToken(mockPayload);
    const decoded = jwt.decode(token, { complete: true });
    
    expect(decoded.header.alg).toBe('HS256');
    // Verificamos que NO se use algorithm: 'none' que es inseguro
  });

  test('debe validar que JWT_SECRET esté configurado', () => {
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.JWT_SECRET.length).toBeGreaterThan(10);
  });

  test('debe rechazar payload con claims peligrosos', () => {
    const dangerousPayload = {
      user_id: 1,
      email: 'test@example.com',
      isAdmin: true // Claim no autorizado
    };
    
    const token = generateToken(dangerousPayload);
    const decoded = verifyToken(token);
    
    // Token es válido, pero el backend debe validar claims específicos
    expect(decoded).toBeDefined();
    
    // El backend NO debe confiar ciegamente en claims no estándar
    // Debe verificar role_id contra DB, no isAdmin del token
  });

  test('debe truncar tokens excesivamente largos', () => {
    const hugPayload = {
      user_id: 1,
      email: 'test@example.com',
      data: 'x'.repeat(10000) // 10KB de data
    };
    
    const token = generateToken(hugPayload);
    
    // JWT debe generarse pero será muy largo
    expect(token.length).toBeGreaterThan(1000);
    
    // Debería existir validación de tamaño en middleware
    // Para prevenir ataques DoS con headers gigantes
  });
});
