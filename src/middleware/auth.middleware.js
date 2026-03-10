/**
 * Middleware de Autenticación
 * Verifica JWT y permisos de usuario
 */

import { verifyToken } from '../utils/jwt.util.js';

const ROLE_NAME_TO_ID = {
    admin: 1,
    user: 2,
    operator: 3
};

const normalizeRoleToId = (role) => {
    if (typeof role === 'number') return role;
    if (typeof role === 'string') {
        return ROLE_NAME_TO_ID[role.toLowerCase()];
    }
    return undefined;
};

const normalizeRoleLabel = (role) => {
    if (typeof role === 'string') {
        const normalized = role.toLowerCase();
        if (normalized === 'admin') return 'administrador';
        return normalized;
    }
    if (typeof role === 'number') return `role_id ${role}`;
    return 'desconocido';
};

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
 * Valida que el usuario autenticado tenga alguno de los roles requeridos
 * Debe usarse después de verifyTokenMiddleware
 */
export const requireRole = (requiredRoles) => {
    const requiredList = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const requiredRoleIds = requiredList.map(normalizeRoleToId).filter((roleId) => roleId !== undefined);

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado'
            });
        }

        // Fallback defensivo: en caso de configuración inválida del middleware
        if (requiredRoleIds.length === 0) {
            return res.status(500).json({
                success: false,
                message: 'Configuración de roles inválida'
            });
        }

        if (!requiredRoleIds.includes(req.user.role_id)) {
            const rolesLabel = requiredList.map(normalizeRoleLabel).join(' o ');
            return res.status(403).json({
                success: false,
                message: `Acceso denegado: se requiere rol de ${rolesLabel}`
            });
        }

        next();
    };
};

/**
 * Verifica si el usuario tiene rol de administrador (role_id = 1)
 * Debe usarse después de verifyTokenMiddleware
 */
export const isAdmin = requireRole('admin');

/**
 * Verifica si existe una sesión activa (usuario autenticado)
 * Alias de verifyTokenMiddleware para mayor claridad semántica
 */
export const isAuthenticated = (req, res, next) => {
    return verifyTokenMiddleware(req, res, next);
};

export default { verifyTokenMiddleware, requireRole, isAdmin, isAuthenticated };
