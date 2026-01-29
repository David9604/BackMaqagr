/**
 * Middleware de Autenticación
 * Verifica JWT y permisos de usuario
 */

import { verifyToken } from '../utils/jwt.util.js';

/**
 * Verifica que el token JWT sea válido
 * Extrae token del header: Authorization: Bearer <token>
 * Agrega datos del usuario a req.user
 */
export const verifyTokenMiddleware = (req, res, next) => {
    try {
        // Obtiene el header de autorización
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        // Extrae el token (formato: Bearer <token>)
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Formato de token inválido'
            });
        }

        // Verifica y decodifica el token
        const decoded = verifyToken(token);

        // Agrega datos del usuario a la request
        req.user = decoded;

        next();
    } catch (error) {
        // Token inválido o expirado
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado'
        });
    }
};

/**
 * Verifica si el usuario tiene rol de administrador (role_id = 1)
 * Debe usarse después de verifyTokenMiddleware
 */
export const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'No autenticado'
        });
    }

    if (req.user.role_id !== 1) {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado: se requiere rol de administrador'
        });
    }

    next();
};

/**
 * Verifica si existe una sesión activa (usuario autenticado)
 * Alias de verifyTokenMiddleware para mayor claridad semántica
 */
export const isAuthenticated = (req, res, next) => {
    return verifyTokenMiddleware(req, res, next);
};

export default { verifyTokenMiddleware, isAdmin, isAuthenticated };
