/**
 * Admin Controller - User Management
 * Handles admin-only user operations (list, update role/status)
 */

import { pool } from '../config/db.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { successResponse, notFoundResponse, validationErrorResponse } from '../utils/response.util.js';
import logger from '../utils/logger.js';

/**
 * Obtener todos los usuarios (Admin)
 * GET /api/admin/users
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT u.user_id, u.name, u.email, u.status, u.registration_date, u.last_session,
           r.role_name, r.role_id
    FROM users u
    LEFT JOIN role r ON u.role_id = r.role_id
    ORDER BY u.registration_date DESC
  `);

  return successResponse(res, result.rows, 'Usuarios obtenidos exitosamente');
});

/**
 * Obtener un usuario por ID (Admin)
 * GET /api/admin/users/:id
 */
export const getUserById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id) || id <= 0) {
    return validationErrorResponse(res, ['ID de usuario inválido'], 'ID de usuario inválido');
  }

  const result = await pool.query(`
    SELECT u.user_id, u.name, u.email, u.status, u.registration_date, u.last_session,
           r.role_name, r.role_id
    FROM users u
    LEFT JOIN role r ON u.role_id = r.role_id
    WHERE u.user_id = $1
  `, [id]);

  if (result.rows.length === 0) {
    return notFoundResponse(res, 'Usuario no encontrado');
  }

  return successResponse(res, result.rows[0], 'Usuario obtenido exitosamente');
});

/**
 * Actualizar rol y/o estado de un usuario (Admin)
 * PUT /api/admin/users/:id
 * Permite cambiar role_id (1=admin, 2=user) y status (active/inactive/suspended)
 */
export const updateUser = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id) || id <= 0) {
    return validationErrorResponse(res, ['ID de usuario inválido'], 'ID de usuario inválido');
  }

  const { role_id, status, name, email } = req.body;

  // Validar role_id si se proporciona
  const allowedRoles = [1, 2]; // admin, user
  if (role_id !== undefined && !allowedRoles.includes(role_id)) {
    return validationErrorResponse(
      res,
      [`role_id debe ser uno de: ${allowedRoles.join(', ')} (1=admin, 2=user)`],
      'Rol inválido',
    );
  }

  // Validar status si se proporciona
  const allowedStatuses = ['active', 'inactive', 'suspended'];
  if (status !== undefined && !allowedStatuses.includes(status)) {
    return validationErrorResponse(
      res,
      [`status debe ser uno de: ${allowedStatuses.join(', ')}`],
      'Estado inválido',
    );
  }

  // Verificar que el usuario existe
  const existingUser = await pool.query('SELECT user_id FROM users WHERE user_id = $1', [id]);

  if (existingUser.rows.length === 0) {
    return notFoundResponse(res, 'Usuario no encontrado');
  }

  // No permitir que un admin se desactive a sí mismo
  if (req.user && req.user.user_id === id && role_id !== undefined && role_id !== 1) {
    return validationErrorResponse(
      res,
      ['No puedes cambiar tu propio rol de administrador'],
      'Acción no permitida',
    );
  }

  // Construir query dinámico
  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(name);
  }
  if (email !== undefined) {
    updates.push(`email = $${paramIndex++}`);
    values.push(email.toLowerCase());
  }
  if (role_id !== undefined) {
    updates.push(`role_id = $${paramIndex++}`);
    values.push(role_id);
  }
  if (status !== undefined) {
    updates.push(`status = $${paramIndex++}`);
    values.push(status);
  }

  if (updates.length === 0) {
    return validationErrorResponse(
      res,
      ['Debe proporcionar al menos un campo para actualizar (name, email, role_id, status)'],
      'No hay datos para actualizar',
    );
  }

  values.push(id);

  const result = await pool.query(`
    UPDATE users
    SET ${updates.join(', ')}
    WHERE user_id = $${paramIndex}
    RETURNING user_id, name, email, role_id, status, registration_date, last_session
  `, values);

  const updatedUser = result.rows[0];

  // Obtener el role_name
  const roleResult = await pool.query('SELECT role_name FROM role WHERE role_id = $1', [updatedUser.role_id]);
  updatedUser.role_name = roleResult.rows[0]?.role_name || 'unknown';

  logger.info('Usuario actualizado por admin', {
    userId: id,
    updatedBy: req.user?.user_id,
    fields: Object.keys(req.body),
  });

  return successResponse(res, updatedUser, 'Usuario actualizado exitosamente');
});

export default {
  getAllUsers,
  getUserById,
  updateUser,
};