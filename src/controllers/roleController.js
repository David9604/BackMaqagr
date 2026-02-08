/**
 * Controlador de Roles
 * Maneja operaciones CRUD para roles del sistema
 * Solo administradores pueden crear, editar y eliminar roles
 */

import Role from '../models/Role.js';
import { pool } from '../config/db.js';
import { asyncHandler } from '../middleware/error.middleware.js';

// Constantes para paginación
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

/**
 * Obtiene todos los roles con paginación
 * GET /api/roles
 * Requiere autenticación (verifyTokenMiddleware)
 * @param {Object} req.query.page - Número de página (opcional, default: 1)
 * @param {Object} req.query.limit - Cantidad por página (opcional, default: 10)
 */
export const getAllRoles = asyncHandler(async (req, res) => {
  // Obtener parámetros de paginación
  const page = parseInt(req.query.page) || DEFAULT_PAGE;
  const limit = parseInt(req.query.limit) || DEFAULT_LIMIT;
  const offset = (page - 1) * limit;

  // Obtener total de roles para paginación
  const countResult = await pool.query(
    'SELECT COUNT(*) FROM role WHERE status = $1',
    ['active']
  );
  const total = parseInt(countResult.rows[0].count);

  // Obtener roles con paginación
  const result = await pool.query(
    `SELECT role_id, role_name, description, status, created_at, updated_at 
     FROM role 
     WHERE status = 'active'
     ORDER BY role_id
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  // Calcular información de paginación
  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    success: true,
    message: 'Roles obtenidos exitosamente',
    data: {
      roles: result.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit
      }
    }
  });
});

/**
 * Crea un nuevo rol en el sistema
 * POST /api/roles
 * Requiere autenticación y rol de administrador (isAdmin)
 */
export const createRole = asyncHandler(async (req, res) => {
  const { role_name, description } = req.body;

  // Validar datos de entrada
  if (!role_name) {
    return res.status(400).json({
      success: false,
      message: 'El nombre del rol es requerido'
    });
  }

  // Validar longitud mínima del nombre
  if (role_name.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'El nombre del rol debe tener al menos 2 caracteres'
    });
  }

  // Verificar si el rol ya existe
  const existingRole = await Role.findByName(role_name);

  if (existingRole) {
    return res.status(409).json({
      success: false,
      message: 'Ya existe un rol con ese nombre'
    });
  }

  // Crear rol en BD
  const newRole = await Role.create({
    role_name,
    description: description || null,
    status: 'active'
  });

  return res.status(201).json({
    success: true,
    message: 'Rol creado exitosamente',
    data: {
      role: newRole
    }
  });
});

/**
 * Actualiza un rol existente por ID
 * PUT /api/roles/:id
 * Requiere autenticación y rol de administrador (isAdmin)
 */
export const updateRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role_name, description, status } = req.body;

  // Validar que el ID sea un número válido
  const roleId = parseInt(id);
  if (isNaN(roleId)) {
    return res.status(400).json({
      success: false,
      message: 'ID de rol inválido'
    });
  }

  // Verificar que el rol existe
  const existingRole = await Role.findById(roleId);

  if (!existingRole) {
    return res.status(404).json({
      success: false,
      message: 'Rol no encontrado'
    });
  }

  // Validar que al menos un campo sea proporcionado
  if (!role_name && !description && !status) {
    return res.status(400).json({
      success: false,
      message: 'Debe proporcionar al menos un campo para actualizar'
    });
  }

  // Validar longitud mínima del nombre si se proporciona
  if (role_name && role_name.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'El nombre del rol debe tener al menos 2 caracteres'
    });
  }

  // Verificar que el nuevo nombre no esté en uso por otro rol
  if (role_name) {
    const roleWithSameName = await Role.findByName(role_name);
    if (roleWithSameName && roleWithSameName.role_id !== roleId) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe otro rol con ese nombre'
      });
    }
  }

  // Validar status si se proporciona
  if (status && !['active', 'inactive'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Estado inválido. Debe ser "active" o "inactive"'
    });
  }

  // Actualizar rol en BD
  const updatedRole = await Role.update(roleId, {
    role_name: role_name || null,
    description: description !== undefined ? description : null,
    status: status || null
  });

  return res.status(200).json({
    success: true,
    message: 'Rol actualizado exitosamente',
    data: {
      role: updatedRole
    }
  });
});

/**
 * Elimina un rol (soft delete - cambia status a 'inactive')
 * DELETE /api/roles/:id
 * Requiere autenticación y rol de administrador (isAdmin)
 * No permite eliminar roles con usuarios asignados
 */
export const deleteRole = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validar que el ID sea un número válido
  const roleId = parseInt(id);
  if (isNaN(roleId)) {
    return res.status(400).json({
      success: false,
      message: 'ID de rol inválido'
    });
  }

  // Verificar que el rol existe
  const existingRole = await Role.findById(roleId);

  if (!existingRole) {
    return res.status(404).json({
      success: false,
      message: 'Rol no encontrado'
    });
  }

  // No permitir eliminar el rol de administrador (role_id = 1)
  if (roleId === 1) {
    return res.status(403).json({
      success: false,
      message: 'No se puede eliminar el rol de administrador'
    });
  }

  // Verificar si hay usuarios asignados a este rol
  const usersWithRole = await pool.query(
    'SELECT COUNT(*) FROM users WHERE role_id = $1 AND status = $2',
    [roleId, 'active']
  );

  if (parseInt(usersWithRole.rows[0].count) > 0) {
    return res.status(409).json({
      success: false,
      message: 'No se puede eliminar el rol porque tiene usuarios asignados'
    });
  }

  // Soft delete: cambiar status a 'inactive'
  const deletedRole = await Role.update(roleId, {
    status: 'inactive'
  });

  return res.status(200).json({
    success: true,
    message: 'Rol eliminado exitosamente',
    data: {
      role: deletedRole
    }
  });
});

export default { getAllRoles, createRole, updateRole, deleteRole };
