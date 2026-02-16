import { Router } from "express";
import {
  getAllTerrains,
  getTerrainById,
  createTerrain,
  updateTerrain,
  deleteTerrain,
} from "../controllers/terrainController.js";
import { verifyTokenMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
// Los usuarios solo pueden ver/editar/eliminar sus propios terrenos

/**
 * @swagger
 * /api/terrains:
 *   get:
 *     summary: Obtener terrenos del usuario autenticado
 *     description: |
 *       Retorna todos los terrenos que pertenecen al usuario autenticado.
 *       Cada usuario solo puede ver sus propios terrenos (ownership validation).
 *     tags: [Terrains]
 *     security:
 *       - BearerAuth: []
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
 *         description: Lista de terrenos del usuario
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
 *                     $ref: '#/components/schemas/Terrain'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 5
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     offset:
 *                       type: integer
 *                       example: 0
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
router.get("/", verifyTokenMiddleware, getAllTerrains);

/**
 * @swagger
 * /api/terrains/{id}:
 *   get:
 *     summary: Obtener terreno por ID
 *     description: |
 *       Retorna los datos de un terreno específico.
 *       Solo retorna el terreno si pertenece al usuario autenticado (ownership validation).
 *     tags: [Terrains]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del terreno
 *         example: 1
 *     responses:
 *       200:
 *         description: Terreno encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Terrain'
 *       400:
 *         description: ID de terreno inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "ID de terreno inválido"
 *       401:
 *         description: Token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Terreno no encontrado o no pertenece al usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Terreno no encontrado"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", verifyTokenMiddleware, getTerrainById);

/**
 * @swagger
 * /api/terrains:
 *   post:
 *     summary: Crear nuevo terreno
 *     description: |
 *       Crea un nuevo terreno asociado al usuario autenticado.
 *       El user_id se asigna automáticamente desde el token JWT.
 *       Campos requeridos: name, altitude_meters, slope_percentage, soil_type.
 *     tags: [Terrains]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TerrainCreate'
 *           example:
 *             name: "Parcela Norte"
 *             altitude_meters: 2500
 *             slope_percentage: 15
 *             soil_type: "clay"
 *             temperature_celsius: 18
 *     responses:
 *       201:
 *         description: Terreno creado exitosamente
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
 *                   example: "Terreno creado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Terrain'
 *       400:
 *         description: Datos de validación inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               errors: ["name es requerido", "altitude_meters es requerido", "soil_type es requerido"]
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
router.post("/", verifyTokenMiddleware, createTerrain);

/**
 * @swagger
 * /api/terrains/{id}:
 *   put:
 *     summary: Actualizar terreno
 *     description: |
 *       Actualiza los datos de un terreno existente.
 *       Solo el propietario del terreno puede actualizarlo (ownership validation).
 *       Solo se actualizan los campos proporcionados (COALESCE).
 *     tags: [Terrains]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del terreno a actualizar
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TerrainUpdate'
 *           example:
 *             name: "Parcela Norte Actualizada"
 *             slope_percentage: 12
 *             temperature_celsius: 20
 *     responses:
 *       200:
 *         description: Terreno actualizado exitosamente
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
 *                   example: "Terreno actualizado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Terrain'
 *       400:
 *         description: ID de terreno inválido
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
 *       404:
 *         description: Terreno no encontrado o no pertenece al usuario
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
router.put("/:id", verifyTokenMiddleware, updateTerrain);

/**
 * @swagger
 * /api/terrains/{id}:
 *   delete:
 *     summary: Eliminar terreno
 *     description: |
 *       Elimina un terreno de forma permanente (eliminación real, no soft delete).
 *       Solo el propietario del terreno puede eliminarlo (ownership validation).
 *     tags: [Terrains]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del terreno a eliminar
 *         example: 1
 *     responses:
 *       200:
 *         description: Terreno eliminado exitosamente
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
 *                   example: "Terreno eliminado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Terrain'
 *       400:
 *         description: ID de terreno inválido
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
 *       404:
 *         description: Terreno no encontrado o no pertenece al usuario
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
router.delete("/:id", verifyTokenMiddleware, deleteTerrain);

export default router;
