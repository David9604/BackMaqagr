/**
 * Controlador de Autenticación
 * Maneja registro de usuarios
 */

import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt.util.js';
import { pool } from '../config/db.js';

// Constantes
const SALT_ROUNDS = 10;
const DEFAULT_ROLE_ID = 2; // Usuario común

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} true si el formato es válido
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Registra un nuevo usuario en el sistema
 * POST /api/auth/register
 */
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validar datos de entrada
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, email y contraseña son requeridos'
            });
        }

        // Validar formato de email
        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de email inválido'
            });
        }

        // Validar longitud mínima de contraseña
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Verificar si el email ya está registrado
        const existingUser = await pool.query(
            'SELECT user_id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Hashear contraseña con bcrypt
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Crear usuario en BD
        const result = await pool.query(
            `INSERT INTO users (name, email, password, role_id, status) 
       VALUES ($1, $2, $3, $4, 'active') 
       RETURNING user_id, name, email, role_id, status, registration_date`,
            [name, email.toLowerCase(), hashedPassword, DEFAULT_ROLE_ID]
        );

        const newUser = result.rows[0];

        // Generar token JWT
        const token = generateToken({
            user_id: newUser.user_id,
            email: newUser.email,
            role_id: newUser.role_id,
            name: newUser.name
        });

        // Respuesta exitosa
        return res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user: {
                    user_id: newUser.user_id,
                    name: newUser.name,
                    email: newUser.email,
                    role_id: newUser.role_id,
                    status: newUser.status,
                    registration_date: newUser.registration_date
                },
                token
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

export default { register };
