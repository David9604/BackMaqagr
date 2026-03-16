import { Router } from "express";
import {
  generateRecommendation,
  generateAdvancedRecommendation,
  getRecommendationHistory,
  getRecommendationById,
} from "../controllers/recommendationController.js";
import { verifyTokenMiddleware } from "../middleware/auth.middleware.js";

import { cacheMiddleware } from "../middleware/cache.middleware.js";

const router = Router();

// RUTAS DE RECOMENDACIONES
// Base path: /api/recommendations

/**
 * @swagger
 * /api/recommendations/generate:
 *   post:
 *     summary: Generar recomendaciones de tractores
 *     description: |
 *       Genera recomendaciones inteligentes de tractores para un terreno e implemento específicos.
 *
 *       **Flujo del algoritmo de recomendación:**
 *       1. Valida ownership del terreno (debe pertenecer al usuario autenticado)
 *       2. Calcula la potencia mínima requerida para el implemento en el terreno
 *       3. Analiza características del terreno (pendiente, tipo de suelo)
 *       4. Evalúa cada tractor disponible con scoring multi-criterio:
 *          - ⚡ **Eficiencia energética**: Utilización óptima de potencia
 *          - 🛞 **Tracción**: Compatibilidad con pendiente y suelo
 *          - 🌍 **Suelo**: Adecuación al tipo de terreno
 *          - 💰 **Económico**: Relación costo-beneficio
 *          - ✅ **Disponibilidad**: Estado del tractor
 *       5. Retorna top 5 tractores rankeados con explicaciones detalladas
 *       6. Persiste las top 3 recomendaciones en la base de datos
 *
 *       **Clasificaciones posibles:**
 *       - 🟢 OPTIMAL: Ajuste perfecto de potencia
 *       - 🟡 GOOD: Buen balance potencia/necesidad
 *       - 🟠 ACCEPTABLE: Funcional pero no ideal
 *       - 🔴 OVERPOWERED: Sobredimensionado
 *     tags: [Recommendations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecommendationRequest'
 *           example:
 *             terrain_id: 1
 *             implement_id: 2
 *             working_depth_m: 0.25
 *             work_type: "tillage"
 *     responses:
 *       200:
 *         description: Recomendaciones generadas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecommendationResponse'
 *             example:
 *               success: true
 *               message: "Recomendaciones generadas exitosamente"
 *               data:
 *                 queryId: 10
 *                 implement:
 *                   id: 2
 *                   name: "Arado de discos"
 *                   brand: "Baldan"
 *                   type: "plow"
 *                 terrain:
 *                   id: 1
 *                   name: "Parcela Norte"
 *                   soil_type: "clay"
 *                   slope_percentage: 15
 *                 powerRequirement:
 *                   minimum_power_hp: 95.5
 *                 recommendations:
 *                   - rank: 1
 *                     tractor:
 *                       id: 3
 *                       name: "John Deere 6130M"
 *                       brand: "John Deere"
 *                       model: "6130M"
 *                       engine_power_hp: 130
 *                       traction_type: "4x4"
 *                     score:
 *                       total: 87.5
 *                     explanation: "Alta eficiencia energética (85% utilización). Ajuste óptimo de potencia."
 *       400:
 *         description: Campos requeridos faltantes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Campos requeridos: terrain_id, implement_id"
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Usuario no autenticado"
 *       404:
 *         description: Terreno o implemento no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               terrenoNoAccesible:
 *                 summary: Terreno no encontrado o no pertenece al usuario
 *                 value:
 *                   success: false
 *                   message: "Terreno no encontrado o no accesible"
 *               implementoNoEncontrado:
 *                 summary: Implemento no existe
 *                 value:
 *                   success: false
 *                   message: "Implemento no encontrado"
 *               sinTractores:
 *                 summary: No hay tractores disponibles
 *                 value:
 *                   success: false
 *                   message: "No hay tractores disponibles en el sistema"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/generate", verifyTokenMiddleware, generateRecommendation);

/**
 * @swagger
 * /api/recommendations/advanced:
 *   post:
 *     summary: Generar recomendaciones avanzadas con filtros de usuario
 *     description: |
 *       Genera recomendaciones usando el algoritmo mejorado con filtros personalizables:
 *       - Filtro estricto por presupuesto máximo (`budget`).
 *       - Preferencia de marca elegida (`brandPreference`).
 *       - Pesos customizables para evaluar: adecuación de potencia, precio, preferencia de marca y eficiencia de combustible.
 *     tags: [Recommendations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - terrain_id
 *               - implement_id
 *             properties:
 *               terrain_id:
 *                 type: integer
 *               implement_id:
 *                 type: integer
 *               filters:
 *                 type: object
 *                 properties:
 *                   budget:
 *                     type: number
 *                   brandPreference:
 *                     type: string
 *               customWeights:
 *                 type: object
 *                 properties:
 *                   power_match:
 *                     type: number
 *                   price:
 *                     type: number
 *                   brand_preference:
 *                     type: number
 *                   fuel_efficiency:
 *                     type: number
 *           example:
 *             terrain_id: 1
 *             implement_id: 2
 *             filters:
 *               budget: 50000
 *               brandPreference: "John Deere"
 *             customWeights:
 *               power_match: 40
 *               price: 30
 *               brand_preference: 20
 *               fuel_efficiency: 10
 *     responses:
 *       200:
 *         description: Recomendaciones avanzadas generadas exitosamente
 *       400:
 *         description: Campos requeridos faltantes
 *       401:
 *         description: Usuario no autenticado
 *       404:
 *         description: Terreno o implemento no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post("/advanced", verifyTokenMiddleware, generateAdvancedRecommendation);

/**
 * @swagger
 * /api/recommendations/history:
 *   get:
 *     summary: Obtener historial de recomendaciones
 *     description: |
 *       Obtiene el historial de recomendaciones generadas por el usuario autenticado.
 *       Incluye datos del terreno, tractor e implemento asociados.
 *       Soporta paginación y filtrado por tipo de trabajo.
 *     tags: [Recommendations]
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
 *           maximum: 50
 *         description: Registros por página (máximo 50)
 *       - in: query
 *         name: work_type
 *         schema:
 *           type: string
 *           enum: [tillage, planting, harvesting, transport, general]
 *         description: Filtrar por tipo de trabajo
 *     responses:
 *       200:
 *         description: Historial de recomendaciones obtenido
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
 *                     $ref: '#/components/schemas/RecommendationHistory'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *                     totalItems:
 *                       type: integer
 *                       example: 25
 *                     itemsPerPage:
 *                       type: integer
 *                       example: 10
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
router.get(
  "/history",
  verifyTokenMiddleware,
  cacheMiddleware(3600),
  getRecommendationHistory,
);

/**
 * @swagger
 * /api/recommendations/{id}:
 *   get:
 *     summary: Obtener recomendación por ID
 *     description: |
 *       Obtiene los detalles completos de una recomendación específica.
 *       Incluye datos del usuario, terreno, tractor, implemento, score de compatibilidad
 *       y observaciones detalladas (ranking, factores de score, explicación).
 *     tags: [Recommendations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la recomendación
 *         example: 1
 *     responses:
 *       200:
 *         description: Recomendación encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     recommendation_id:
 *                       type: integer
 *                       example: 1
 *                     user_id:
 *                       type: integer
 *                     user_name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     terrain_name:
 *                       type: string
 *                     soil_type:
 *                       type: string
 *                     slope_percentage:
 *                       type: number
 *                     tractor_name:
 *                       type: string
 *                     tractor_brand:
 *                       type: string
 *                     tractor_model:
 *                       type: string
 *                     engine_power_hp:
 *                       type: number
 *                     implement_name:
 *                       type: string
 *                     implement_type:
 *                       type: string
 *                     power_requirement_hp:
 *                       type: number
 *                     compatibility_score:
 *                       type: number
 *                       example: 87.5
 *                     observations:
 *                       type: string
 *                       description: JSON string con detalles del ranking, score y explicación
 *                     work_type:
 *                       type: string
 *                       example: "tillage"
 *                     recommendation_date:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Recomendación no encontrada
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
router.get("/:id", verifyTokenMiddleware, getRecommendationById);

export default router;
