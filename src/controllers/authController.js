/**
 * Controlador de Autenticación
 * Maneja registro, inicio y cierre de sesión de usuarios
 */

import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt.util.js';
import { pool } from '../config/db.js';
import User from '../models/User.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import {
    successResponse,
    createdResponse,
    unauthorizedResponse,
    conflictResponse,
    notFoundResponse,
    validationErrorResponse
} from '../utils/response.util.js';
import {
    isValidEmail,
    isValidPassword,
    getPasswordValidationErrors
} from '../utils/validators.util.js';
import logger from '../utils/logger.js';

// Constantes
const SALT_ROUNDS = 10;
const DEFAULT_ROLE_ID = 2; // Usuario común

/**
 * Registra un nuevo usuario en el sistema
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Validar datos de entrada
    const errors = [];
    if (!name) errors.push('Nombre es requerido');
    if (!email) errors.push('Email es requerido');
    if (!password) errors.push('Contraseña es requerida');

    if (errors.length > 0) {
        return validationErrorResponse(res, errors, 'Datos de entrada incompletos');
    }

    // Validar formato de email
    if (!isValidEmail(email)) {
        throw new AppError('Formato de email inválido', 400);
    }

    // Validar contraseña fuerte
    if (!isValidPassword(password)) {
        const passwordErrors = getPasswordValidationErrors(password);
        return validationErrorResponse(res, passwordErrors, 'Contraseña no cumple requisitos');
    }

    // Verificar si el email ya está registrado
    const existingUser = await pool.query(
        'SELECT user_id FROM users WHERE email = $1',
        [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
        return conflictResponse(res, 'El email ya está registrado');
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

    // Log del registro exitoso
    logger.info('Nuevo usuario registrado', {
        userId: newUser.user_id,
        email: newUser.email
    });

    // Respuesta exitosa
    return createdResponse(res, {
        user: {
            user_id: newUser.user_id,
            name: newUser.name,
            email: newUser.email,
            role_id: newUser.role_id,
            status: newUser.status,
            registration_date: newUser.registration_date
        },
        token
    }, 'Usuario registrado exitosamente');
});

/**
 * Inicia sesión de un usuario registrado
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validar datos de entrada
    if (!email || !password) {
        throw new AppError('Email y contraseña son requeridos', 400);
    }

    // Buscar usuario por email usando modelo User
    const user = await User.findByEmail(email.toLowerCase());

    // Verificar si el usuario existe
    if (!user) {
        return unauthorizedResponse(res, 'Credenciales inválidas');
    }

    // Verificar que el usuario esté activo
    if (user.status !== 'active') {
        return unauthorizedResponse(res, 'Usuario inactivo o suspendido');
    }

    // Validar contraseña con bcrypt.compare()
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return unauthorizedResponse(res, 'Credenciales inválidas');
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

    // Log del inicio de sesión exitoso
    logger.info('Usuario inició sesión', {
        userId: user.user_id,
        email: user.email
    });

    // Respuesta exitosa con token y datos del usuario
    return successResponse(res, {
        token,
        user: {
            name: user.name,
            email: user.email,
            role_id: user.role_id
        }
    }, 'Inicio de sesión exitoso');
});

/**
 * Cierra sesión del usuario
 * POST /api/auth/logout
 * Nota: JWT es stateless, solo retorna mensaje de éxito
 */
export const logout = asyncHandler(async (req, res) => {
    // JWT es stateless, no requiere invalidación en servidor
    return successResponse(res, null, 'Sesión cerrada exitosamente');
});

/**
 * Obtiene el perfil del usuario autenticado
 * GET /api/auth/profile
 * Requiere autenticación (verifyTokenMiddleware)
 */
export const getProfile = asyncHandler(async (req, res) => {
    // Obtener user_id desde req.user (middleware)
    const { user_id } = req.user;

    // Buscar usuario en BD
    const user = await User.findById(user_id);

    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    // Retornar datos sin contraseña
    return successResponse(res, {
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
    }, 'Perfil obtenido exitosamente');
});

/**
 * Actualiza el perfil del usuario autenticado
 * PUT /api/auth/profile
 * Requiere autenticación (verifyTokenMiddleware)
 * Solo permite actualizar nombre y email (no rol)
 */
export const updateProfile = asyncHandler(async (req, res) => {
    const { user_id } = req.user;
    const { name, email } = req.body;

    // Validar que al menos un campo sea proporcionado
    if (!name && !email) {
        throw new AppError('Debe proporcionar al menos nombre o email para actualizar', 400);
    }

    // Validar formato de email si se proporciona
    if (email && !isValidEmail(email)) {
        throw new AppError('Formato de email inválido', 400);
    }

    // Verificar si el nuevo email ya está en uso por otro usuario
    if (email) {
        const existingUser = await pool.query(
            'SELECT user_id FROM users WHERE email = $1 AND user_id != $2',
            [email.toLowerCase(), user_id]
        );

        if (existingUser.rows.length > 0) {
            return conflictResponse(res, 'El email ya está en uso por otro usuario');
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

    logger.info('Perfil actualizado', { userId: user_id });

    // Retornar datos actualizados
    return successResponse(res, {
        user: {
            user_id: updatedUser.user_id,
            name: updatedUser.name,
            email: updatedUser.email,
            role_id: updatedUser.role_id,
            status: updatedUser.status,
            registration_date: updatedUser.registration_date,
            last_session: updatedUser.last_session
        }
    }, 'Perfil actualizado exitosamente');
});

/**
 * Cambia la contraseña del usuario autenticado
 * PUT /api/auth/password
 * Requiere autenticación (verifyTokenMiddleware)
 */
export const changePassword = asyncHandler(async (req, res) => {
    const { user_id } = req.user;
    const { currentPassword, newPassword } = req.body;

    // Validar datos de entrada
    if (!currentPassword || !newPassword) {
        throw new AppError('Contraseña actual y nueva contraseña son requeridas', 400);
    }

    // Validar contraseña fuerte
    if (!isValidPassword(newPassword)) {
        const passwordErrors = getPasswordValidationErrors(newPassword);
        return validationErrorResponse(res, passwordErrors, 'La nueva contraseña no cumple requisitos');
    }

    // Buscar usuario para obtener contraseña actual
    const user = await User.findById(user_id);

    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    // Validar contraseña actual con bcrypt
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
        return unauthorizedResponse(res, 'La contraseña actual es incorrecta');
    }

    // Hashear nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Actualizar en BD
    await User.updatePassword(user_id, hashedNewPassword);

    logger.info('Contraseña actualizada', { userId: user_id });

    // Retornar mensaje de éxito
    return successResponse(res, null, 'Contraseña actualizada exitosamente');
});

export default { register, login, logout, getProfile, updateProfile, changePassword };
