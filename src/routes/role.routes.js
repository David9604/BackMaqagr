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

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Listar todos los roles
 *     description: |
 *       Retorna la lista de roles activos del sistema con paginación.
 *       Requiere autenticación (cualquier usuario autenticado puede ver los roles).
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de registros por página
 *     responses:
 *       200:
 *         description: Lista de roles obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Roles obtenidos exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     roles:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Role'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 1
 *                         totalItems:
 *                           type: integer
 *                           example: 3
 *                         itemsPerPage:
 *                           type: integer
 *                           example: 10
 *       401:
 *         description: Token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', verifyTokenMiddleware, getAllRoles);

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Crear nuevo rol
 *     description: |
 *       Crea un nuevo rol en el sistema. **Solo administradores**.
 *       El nombre del rol debe ser único y tener al menos 2 caracteres.
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleCreate'
 *           example:
 *             role_name: "moderator"
 *             description: "Moderador del sistema"
 *     responses:
 *       201:
 *         description: Rol creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Rol creado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     role:
 *                       $ref: '#/components/schemas/Role'
 *       400:
 *         description: Datos de validación inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               nombreRequerido:
 *                 summary: Nombre del rol faltante
 *                 value:
 *                   success: false
 *                   message: "El nombre del rol es requerido"
 *               nombreCorto:
 *                 summary: Nombre demasiado corto
 *                 value:
 *                   success: false
 *                   message: "El nombre del rol debe tener al menos 2 caracteres"
 *       401:
 *         description: Token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Acceso denegado - se requiere rol de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Ya existe un rol con ese nombre
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Ya existe un rol con ese nombre"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', verifyTokenMiddleware, isAdmin, createRole);

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Actualizar rol por ID
 *     description: |
 *       Actualiza un rol existente. **Solo administradores**.
 *       Se debe proporcionar al menos un campo para actualizar.
 *       Si se cambia el nombre, se verifica que no esté en uso por otro rol.
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol a actualizar
 *         example: 3
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleUpdate'
 *           example:
 *             role_name: "super_moderator"
 *             description: "Moderador con permisos extendidos"
 *             status: "active"
 *     responses:
 *       200:
 *         description: Rol actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Rol actualizado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     role:
 *                       $ref: '#/components/schemas/Role'
 *       400:
 *         description: ID inválido, datos faltantes o status inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               idInvalido:
 *                 summary: ID de rol inválido
 *                 value:
 *                   success: false
 *                   message: "ID de rol inválido"
 *               sinCampos:
 *                 summary: Sin campos para actualizar
 *                 value:
 *                   success: false
 *                   message: "Debe proporcionar al menos un campo para actualizar"
 *               statusInvalido:
 *                 summary: Status no permitido
 *                 value:
 *                   success: false
 *                   message: 'Estado inválido. Debe ser "active" o "inactive"'
 *       401:
 *         description: Token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Acceso denegado - se requiere rol de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Rol no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Rol no encontrado"
 *       409:
 *         description: Ya existe otro rol con ese nombre
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', verifyTokenMiddleware, isAdmin, updateRole);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Eliminar rol por ID
 *     description: |
 *       Elimina un rol del sistema (soft delete - cambia status a 'inactive').
 *       **Solo administradores**.
 *       No permite eliminar roles que tienen usuarios asignados.
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol a eliminar
 *         example: 3
 *     responses:
 *       200:
 *         description: Rol eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Rol eliminado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     role:
 *                       $ref: '#/components/schemas/Role'
 *       400:
 *         description: ID de rol inválido o rol con usuarios asignados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               idInvalido:
 *                 summary: ID inválido
 *                 value:
 *                   success: false
 *                   message: "ID de rol inválido"
 *               conUsuarios:
 *                 summary: Rol con usuarios asignados
 *                 value:
 *                   success: false
 *                   message: "No se puede eliminar el rol porque tiene usuarios asignados"
 *       401:
 *         description: Token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Acceso denegado - se requiere rol de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Rol no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', verifyTokenMiddleware, isAdmin, deleteRole);

export default router;
