/**
 * Controlador de Autenticación
 * Maneja registro, inicio y cierre de sesión de usuarios
 */

import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt.util.js';
import { pool } from '../config/db.js';
import User from '../models/User.js';

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

/**
 * Inicia sesión de un usuario registrado
 * POST /api/auth/login
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar datos de entrada
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        // Buscar usuario por email usando modelo User
        const user = await User.findByEmail(email.toLowerCase());

        // Verificar si el usuario existe
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Verificar que el usuario esté activo
        if (user.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Usuario inactivo o suspendido'
            });
        }

        // Validar contraseña con bcrypt.compare()
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generar token JWT con datos del usuario
        const token = generateToken({
            user_id: user.user_id,
            email: user.email,
            role_id: user.role_id,
            name: user.name
        });

        // Actualizar campo last_session en BD
        await User.updateLastSession(user.user_id);

        // Respuesta exitosa con token y datos del usuario
        return res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            data: {
                token,
                user: {
                    name: user.name,
                    email: user.email,
                    role_id: user.role_id
                }
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

/**
 * Cierra sesión del usuario
 * POST /api/auth/logout
 * Nota: JWT es stateless, solo retorna mensaje de éxito
 */
export const logout = async (req, res) => {
    try {
        // JWT es stateless, no requiere invalidación en servidor
        return res.status(200).json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });

    } catch (error) {
        console.error('Error en logout:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

export default { register, login, logout };
