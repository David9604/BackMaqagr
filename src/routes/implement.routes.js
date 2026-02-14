import { Router } from 'express';
import {
  getAllImplements,
  getAvailableImplements,
  searchImplements,
  getImplementById,
  createImplement,
  updateImplement,
  deleteImplement,
} from '../controllers/implementController.js';
import {
  verifyTokenMiddleware,
  isAdmin,
} from '../middleware/auth.middleware.js';
import { validateImplement } from '../middleware/validation.middleware.js';

const router = Router();

// ==================== RUTAS PÚBLICAS ====================

/**
 * @swagger
 * /api/implements:
 *   get:
 *     summary: Obtener todos los implementos
 *     description: Retorna la lista completa de implementos agrícolas con paginación. Acceso público.
 *     tags: [Implements]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de registros por página
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Número de registros a saltar
 *     responses:
 *       200:
 *         description: Lista de implementos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Implement'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 15
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     offset:
 *                       type: integer
 *                       example: 0
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', getAllImplements);

/**
 * @swagger
 * /api/implements/available:
 *   get:
 *     summary: Obtener implementos disponibles
 *     description: Retorna solo los implementos con status "available", ordenados por tipo y potencia requerida.
 *     tags: [Implements]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de registros por página
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Número de registros a saltar
 *     responses:
 *       200:
 *         description: Lista de implementos disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Implement'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/available', getAvailableImplements);

/**
 * @swagger
 * /api/implements/search:
 *   get:
 *     summary: Buscar implementos con filtros
 *     description: |
 *       Permite buscar implementos agrícolas aplicando filtros por tipo, tipo de suelo y potencia máxima.
 *       Todos los filtros son opcionales y se pueden combinar.
 *     tags: [Implements]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de implemento (búsqueda parcial, case-insensitive)
 *         example: "plow"
 *       - in: query
 *         name: soilType
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de suelo compatible
 *         example: "clay"
 *       - in: query
 *         name: maxPower
 *         schema:
 *           type: number
 *         description: Filtrar por potencia máxima requerida (HP)
 *         example: 100
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de registros por página
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Número de registros a saltar
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Implement'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                 filters:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       nullable: true
 *                     soilType:
 *                       type: string
 *                       nullable: true
 *                     maxPower:
 *                       type: number
 *                       nullable: true
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/search', searchImplements);

/**
 * @swagger
 * /api/implements/{id}:
 *   get:
 *     summary: Obtener implemento por ID
 *     description: Retorna los datos completos de un implemento agrícola específico.
 *     tags: [Implements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del implemento
 *         example: 1
 *     responses:
 *       200:
 *         description: Implemento encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Implement'
 *       400:
 *         description: ID de implemento inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "ID de implemento inválido"
 *       404:
 *         description: Implemento no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Implemento no encontrado"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', getImplementById);

// ==================== RUTAS PROTEGIDAS (ADMIN) ====================

/**
 * @swagger
 * /api/implements:
 *   post:
 *     summary: Crear nuevo implemento
 *     description: |
 *       Crea un nuevo implemento agrícola en el catálogo. **Solo administradores**.
 *       Tipos válidos: plow, harrow, seeder, sprayer, harvester, cultivator, mower, trailer, other.
 *     tags: [Implements]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ImplementCreate'
 *           example:
 *             implement_name: "Arado de discos 3 cuerpos"
 *             brand: "Baldan"
 *             power_requirement_hp: 85
 *             working_width_m: 1.2
 *             soil_type: "clay"
 *             working_depth_cm: 30
 *             weight_kg: 450
 *             implement_type: "plow"
 *             status: "available"
 *     responses:
 *       201:
 *         description: Implemento creado exitosamente
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
 *                   example: "Implemento creado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Implement'
 *       400:
 *         description: Datos de validación inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', verifyTokenMiddleware, isAdmin, validateImplement, createImplement);

/**
 * @swagger
 * /api/implements/{id}:
 *   put:
 *     summary: Actualizar implemento existente
 *     description: |
 *       Actualiza los datos de un implemento existente. **Solo administradores**.
 *       Solo se actualizan los campos proporcionados (COALESCE).
 *     tags: [Implements]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del implemento a actualizar
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ImplementUpdate'
 *           example:
 *             power_requirement_hp: 90
 *             working_depth_cm: 35
 *     responses:
 *       200:
 *         description: Implemento actualizado exitosamente
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
 *                   example: "Implemento actualizado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Implement'
 *       400:
 *         description: ID inválido o datos de validación incorrectos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *         description: Implemento no encontrado
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
router.put('/:id', verifyTokenMiddleware, isAdmin, validateImplement, updateImplement);

/**
 * @swagger
 * /api/implements/{id}:
 *   delete:
 *     summary: Eliminar implemento
 *     description: Elimina un implemento del catálogo. **Solo administradores**.
 *     tags: [Implements]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del implemento a eliminar
 *         example: 1
 *     responses:
 *       200:
 *         description: Implemento eliminado exitosamente
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
 *                   example: "Implemento eliminado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Implement'
 *       400:
 *         description: ID de implemento inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *         description: Implemento no encontrado
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
router.delete('/:id', verifyTokenMiddleware, isAdmin, deleteImplement);

export default router;

