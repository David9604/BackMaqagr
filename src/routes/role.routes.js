/**
 * Rutas de Gestión de Roles
 * Endpoints para administración de roles del sistema
 * Solo administradores pueden crear, editar y eliminar roles
 */

import { Router } from 'express';
import {
    getAllRoles,
    createRole,
    updateRole,
    deleteRole
} from '../controllers/roleController.js';
import { verifyTokenMiddleware, isAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// ==================== RUTAS PROTEGIDAS ====================

// GET /api/roles - Listar todos los roles (requiere autenticación)
router.get('/', verifyTokenMiddleware, getAllRoles);

// POST /api/roles - Crear nuevo rol (solo administradores)
router.post('/', verifyTokenMiddleware, isAdmin, createRole);

// PUT /api/roles/:id - Actualizar rol por ID (solo administradores)
router.put('/:id', verifyTokenMiddleware, isAdmin, updateRole);

// DELETE /api/roles/:id - Eliminar rol por ID (solo administradores)
router.delete('/:id', verifyTokenMiddleware, isAdmin, deleteRole);

export default router;
