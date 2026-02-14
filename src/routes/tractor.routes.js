import { Router } from 'express';
import {
  getAllTractors,
  getAvailableTractors,
  searchTractors,
  getTractorById,
  createTractor,
  updateTractor,
  deleteTractor,
} from '../controllers/tractorController.js';
import {
  verifyTokenMiddleware,
  isAdmin,
} from '../middleware/auth.middleware.js';
import { validateTractor } from '../middleware/validation.middleware.js';

const router = Router();

// ==================== RUTAS PÚBLICAS ====================

/**
 * @swagger
 * /api/tractors:
 *   get:
 *     summary: Obtener todos los tractores
 *     description: Retorna la lista completa de tractores con paginación. Acceso público.
 *     tags: [Tractors]
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
 *         description: Lista de tractores obtenida exitosamente
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
 *                     $ref: '#/components/schemas/Tractor'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 25
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
router.get('/', getAllTractors);

/**
 * @swagger
 * /api/tractors/available:
 *   get:
 *     summary: Obtener tractores disponibles
 *     description: Retorna solo los tractores con status "available", ordenados por potencia descendente.
 *     tags: [Tractors]
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
 *         description: Lista de tractores disponibles
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
 *                     $ref: '#/components/schemas/Tractor'
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
router.get('/available', getAvailableTractors);

/**
 * @swagger
 * /api/tractors/search:
 *   get:
 *     summary: Buscar tractores con filtros
 *     description: |
 *       Permite buscar tractores aplicando filtros por marca, modelo y rango de potencia.
 *       Todos los filtros son opcionales y se pueden combinar.
 *     tags: [Tractors]
 *     parameters:
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filtrar por marca (búsqueda parcial, case-insensitive)
 *         example: "John Deere"
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *         description: Filtrar por modelo (búsqueda parcial, case-insensitive)
 *         example: "6130"
 *       - in: query
 *         name: minPower
 *         schema:
 *           type: number
 *         description: Potencia mínima en HP
 *         example: 80
 *       - in: query
 *         name: maxPower
 *         schema:
 *           type: number
 *         description: Potencia máxima en HP
 *         example: 200
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
 *                     $ref: '#/components/schemas/Tractor'
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
 *                     brand:
 *                       type: string
 *                       nullable: true
 *                     model:
 *                       type: string
 *                       nullable: true
 *                     minPower:
 *                       type: number
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
router.get('/search', searchTractors);

/**
 * @swagger
 * /api/tractors/{id}:
 *   get:
 *     summary: Obtener tractor por ID
 *     description: Retorna los datos completos de un tractor específico.
 *     tags: [Tractors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del tractor
 *         example: 1
 *     responses:
 *       200:
 *         description: Tractor encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Tractor'
 *       400:
 *         description: ID de tractor inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "ID de tractor inválido"
 *       404:
 *         description: Tractor no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Tractor no encontrado"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', getTractorById);

// ==================== RUTAS PROTEGIDAS (ADMIN) ====================

/**
 * @swagger
 * /api/tractors:
 *   post:
 *     summary: Crear nuevo tractor
 *     description: |
 *       Crea un nuevo tractor en el catálogo. **Solo administradores**.
 *       Campos requeridos: brand, model, engine_power_hp, traction_type.
 *     tags: [Tractors]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TractorCreate'
 *           example:
 *             name: "John Deere 6130M"
 *             brand: "John Deere"
 *             model: "6130M"
 *             engine_power_hp: 130
 *             weight_kg: 5200
 *             traction_force_kn: 45.5
 *             traction_type: "4x4"
 *             tire_type: "radial"
 *             tire_width_mm: 540
 *             tire_diameter_mm: 1600
 *             tire_pressure_psi: 15
 *             status: "available"
 *     responses:
 *       201:
 *         description: Tractor creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Tractor'
 *       400:
 *         description: Datos de validación inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               errors: ["brand es requerido", "engine_power_hp debe ser un número positivo"]
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
 *             example:
 *               success: false
 *               message: "Acceso denegado. Se requiere rol de administrador"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', verifyTokenMiddleware, isAdmin, validateTractor, createTractor);

/**
 * @swagger
 * /api/tractors/{id}:
 *   put:
 *     summary: Actualizar tractor existente
 *     description: |
 *       Actualiza los datos de un tractor existente. **Solo administradores**.
 *       Solo se actualizan los campos proporcionados (COALESCE).
 *     tags: [Tractors]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del tractor a actualizar
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TractorUpdate'
 *           example:
 *             engine_power_hp: 135
 *             status: "maintenance"
 *     responses:
 *       200:
 *         description: Tractor actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Tractor'
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
 *         description: Tractor no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Tractor no encontrado"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', verifyTokenMiddleware, isAdmin, validateTractor, updateTractor);

/**
 * @swagger
 * /api/tractors/{id}:
 *   delete:
 *     summary: Eliminar tractor
 *     description: Elimina un tractor del catálogo. **Solo administradores**.
 *     tags: [Tractors]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del tractor a eliminar
 *         example: 1
 *     responses:
 *       200:
 *         description: Tractor eliminado exitosamente
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
 *                   example: "Tractor eliminado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Tractor'
 *       400:
 *         description: ID de tractor inválido
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
 *         description: Tractor no encontrado
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
router.delete('/:id', verifyTokenMiddleware, isAdmin, deleteTractor);

export default router;
