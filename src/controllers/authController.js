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

/**
 * Obtiene el perfil del usuario autenticado
 * GET /api/auth/profile
 * Requiere autenticación (verifyTokenMiddleware)
 */
export const getProfile = async (req, res) => {
    try {
        // Obtener user_id desde req.user (middleware)
        const { user_id } = req.user;

        // Buscar usuario en BD
        const user = await User.findById(user_id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Retornar datos sin contraseña
        return res.status(200).json({
            success: true,
            message: 'Perfil obtenido exitosamente',
            data: {
                user: {
                    user_id: user.user_id,
                    name: user.name,
                    email: user.email,
                    role_id: user.role_id,
                    role_name: user.role_name,
                    status: user.status,
                    registration_date: user.registration_date,
                    last_session: user.last_session
                }
            }
        });

    } catch (error) {
        console.error('Error al obtener perfil:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

/**
 * Actualiza el perfil del usuario autenticado
 * PUT /api/auth/profile
 * Requiere autenticación (verifyTokenMiddleware)
 * Solo permite actualizar nombre y email (no rol)
 */
export const updateProfile = async (req, res) => {
    try {
        const { user_id } = req.user;
        const { name, email } = req.body;

        // Validar que al menos un campo sea proporcionado
        if (!name && !email) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar al menos nombre o email para actualizar'
            });
        }

        // Validar formato de email si se proporciona
        if (email && !isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de email inválido'
            });
        }

        // Verificar si el nuevo email ya está en uso por otro usuario
        if (email) {
            const existingUser = await pool.query(
                'SELECT user_id FROM users WHERE email = $1 AND user_id != $2',
                [email.toLowerCase(), user_id]
            );

            if (existingUser.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'El email ya está en uso por otro usuario'
                });
            }
        }

        // Actualizar en BD (solo name y email, no role_id ni status)
        const result = await pool.query(
            `UPDATE users 
             SET name = COALESCE($1, name),
                 email = COALESCE($2, email)
             WHERE user_id = $3
             RETURNING user_id, name, email, role_id, status, registration_date, last_session`,
            [name || null, email ? email.toLowerCase() : null, user_id]
        );

        const updatedUser = result.rows[0];

        // Retornar datos actualizados
        return res.status(200).json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            data: {
                user: {
                    user_id: updatedUser.user_id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role_id: updatedUser.role_id,
                    status: updatedUser.status,
                    registration_date: updatedUser.registration_date,
                    last_session: updatedUser.last_session
                }
            }
        });

    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

/**
 * Cambia la contraseña del usuario autenticado
 * PUT /api/auth/password
 * Requiere autenticación (verifyTokenMiddleware)
 */
export const changePassword = async (req, res) => {
    try {
        const { user_id } = req.user;
        const { currentPassword, newPassword } = req.body;

        // Validar datos de entrada
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña actual y nueva contraseña son requeridas'
            });
        }

        // Validar longitud mínima de nueva contraseña
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }

        // Buscar usuario para obtener contraseña actual
        const user = await User.findById(user_id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Validar contraseña actual con bcrypt
        const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password);

        if (!isValidCurrentPassword) {
            return res.status(401).json({
                success: false,
                message: 'La contraseña actual es incorrecta'
            });
        }

        // Hashear nueva contraseña
        const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // Actualizar en BD
        await User.updatePassword(user_id, hashedNewPassword);

        // Retornar mensaje de éxito
        return res.status(200).json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

export default { register, login, logout, getProfile, updateProfile, changePassword };

