/**
 * Utilidad JWT - Generación y verificación de tokens
 * Configuración desde variables de entorno
 */

import jwt from 'jsonwebtoken';

// Configuración JWT desde variables de entorno
const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_desarrollo';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Genera un token JWT con el payload proporcionado
 * @param {Object} payload - Datos a incluir en el token (user_id, email, role_id)
 * @returns {string} Token JWT firmado
 */
export const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verifica y decodifica un token JWT
 * @param {string} token - Token JWT a verificar
 * @returns {Object} Payload decodificado del token
 * @throws {Error} Si el token es inválido o expiró
 */
export const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};

/**
 * Refresca un token expirado generando uno nuevo
 * @param {string} token - Token JWT a refrescar
 * @returns {string|null} Nuevo token o null si no es posible refrescar
 */
export const refreshToken = (token) => {
    try {
        // Decodifica sin verificar expiración para obtener el payload
        const decoded = jwt.decode(token);

        if (!decoded) return null;

        // Extrae datos del usuario (sin info de expiración)
        const { user_id, email, role_id, name } = decoded;

        // Genera nuevo token con los mismos datos
        return generateToken({ user_id, email, role_id, name });
    } catch (error) {
        return null;
    }
};

export default { generateToken, verifyToken, refreshToken };
