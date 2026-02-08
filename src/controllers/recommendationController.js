/**
 * @overview Controlador de recomendaciones de tractores
 * @module controllers/recommendationController
 * 
 * @description
 * Orquesta el flujo completo de recomendación:
 * - Extracción de user_id desde JWT
 * - Validación de ownership del terreno
 * - Llamada al servicio de recomendación
 * - Persistencia transaccional en recommendation + query_history
 * 
 * @requires ../services/recommendationService
 * @requires ../services/minimumPowerService
 */

import { pool } from '../config/db.js';
import Terrain from '../models/Terrain.js';
import Tractor from '../models/Tractor.js';
import Implement from '../models/Implement.js';
import Recommendation from '../models/Recommendation.js';
import { generateRecommendation as generateRec, analyzeTerrain } from '../services/recommendationService.js';
import { calculateMinimumPower } from '../services/minimumPowerService.js';

// CONSTANTES

/**
 * Número máximo de recomendaciones a persistir
 * @constant {number}
 */
const MAX_PERSISTED_RECOMMENDATIONS = 3;

/**
 * Tipos de trabajo para clasificar recomendaciones
 * @constant {Object}
 */
const WORK_TYPES = {
  TILLAGE: 'tillage',
  PLANTING: 'planting',
  HARVESTING: 'harvesting',
  TRANSPORT: 'transport',
  GENERAL: 'general',
};

// HELPERS

/**
 * Extrae el user_id del objeto de usuario autenticado
 * @param {Object} req - Request con usuario autenticado
 * @returns {number|null} ID del usuario
 */
const extractUserId = (req) => {
  return req.user?.userId || req.user?.user_id || null;
};

/**
 * Genera una explicación legible para la recomendación
 * @param {Object} recommendation - Objeto de recomendación con scores
 * @param {Object} terrainAnalysis - Análisis del terreno
 * @returns {string} Explicación en español
 */
const generateExplanation = (recommendation, terrainAnalysis) => {
  const { score, compatibility, classification } = recommendation;
  const { slopeClass } = terrainAnalysis.classification;
  
  const reasons = [];
  
  // Razón principal basada en score más alto
  const breakdown = score.breakdown;
  const maxComponent = Object.entries(breakdown).reduce((a, b) => 
    a[1] > b[1] ? a : b
  );
  
  switch (maxComponent[0]) {
    case 'efficiency':
      reasons.push(`Alta eficiencia energética (${compatibility.utilizationPercent}% utilización)`);
      break;
    case 'traction':
      reasons.push(`Tracción óptima para ${slopeClass === 'STEEP' ? 'pendiente pronunciada' : 'terreno'}`);
      break;
    case 'soil':
      reasons.push('Compatibilidad ideal con tipo de suelo');
      break;
    case 'economic':
      reasons.push('Mejor relación costo-beneficio');
      break;
    case 'availability':
      reasons.push('Disponible inmediatamente');
      break;
  }
  
  // Agregar clasificación
  if (classification.label === 'OPTIMAL') {
    reasons.push('Ajuste óptimo de potencia');
  } else if (classification.label === 'GOOD') {
    reasons.push('Buen balance potencia/necesidad');
  }
  
  return reasons.join('. ') + '.';
};

/**
 * Verifica que el terreno pertenezca al usuario autenticado
 * @description Alineado con PR #11 - DDAAM-40: Los usuarios solo acceden a SUS terrenos
 * @param {number} terrainId - ID del terreno
 * @param {number} userId - ID del usuario autenticado
 * @returns {Promise<Object|null>} Terreno si pertenece al usuario, null si no existe o no tiene acceso
 */
const validateTerrainOwnership = async (terrainId, userId) => {
  // Usar findByIdAndUser para validar ownership (PR #11)
  const terrain = await Terrain.findByIdAndUser(terrainId, userId);
  
  if (!terrain) {
    return null;
  }
  
  // Validar que el terreno esté activo
  if (terrain.status !== 'active') {
    return null;
  }
  
  return terrain;
};

// CONTROLADORES

/**
 * Genera recomendaciones de tractores para un terreno e implemento
 * 
 * @route POST /api/recommendations/generate
 * @access Private (JWT required)
 * 
 * @param {Object} req.body
 * @param {number} req.body.terrain_id - ID del terreno (requerido)
 * @param {number} req.body.implement_id - ID del implemento (requerido)
 * @param {number} [req.body.working_depth_m] - Profundidad de trabajo en metros
 * @param {string} [req.body.work_type] - Tipo de trabajo (tillage, planting, etc.)
 * 
 * @returns {Object} Recomendaciones con tractores hidratados y explicaciones
 */
export const generateRecommendation = async (req, res) => {
  const client = await pool.connect();
  
  try {
    // 1. Extracción y validación de inputs
    const { terrain_id, implement_id, working_depth_m, work_type } = req.body;
    const user_id = extractUserId(req);
    
    // Validar autenticación
    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
    }
    
    // Validar campos requeridos
    if (!terrain_id || !implement_id) {
      return res.status(400).json({
        success: false,
        message: 'Campos requeridos: terrain_id, implement_id',
      });
    }
    
    // 2. Validar ownership del terreno
    const terrain = await validateTerrainOwnership(terrain_id, user_id);
    if (!terrain) {
      return res.status(404).json({
        success: false,
        message: 'Terreno no encontrado o no accesible',
      });
    }
    
    // 3. Consultas en paralelo: Implemento y Tractores
    const [implement, allTractors] = await Promise.all([
      Implement.findById(implement_id),
      Tractor.getAll(),
    ]);
    
    if (!implement) {
      return res.status(404).json({
        success: false,
        message: 'Implemento no encontrado',
      });
    }
    
    // Filtrar tractores disponibles
    const availableTractors = allTractors.filter(t => 
      t.status === 'available' || t.status === 'active'
    );
    
    if (availableTractors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No hay tractores disponibles en el sistema',
      });
    }
    
    // 4. Calcular potencia mínima requerida
    const workingDepthM = working_depth_m || 
      (implement.working_depth_cm ? implement.working_depth_cm / 100 : 0.25);
    
    const implementData = {
      power_requirement_hp: parseFloat(implement.power_requirement_hp),
      working_depth_m: workingDepthM,
    };
    
    const terrainData = {
      soil_type: terrain.soil_type,
      slope_percentage: parseFloat(terrain.slope_percentage),
    };
    
    const powerResult = calculateMinimumPower(implementData, terrainData);
    const requiredPower = powerResult.minimumPowerHP;
    
    // 5. Generar recomendaciones usando el servicio
    const recommendationResult = generateRec({
      terrain: terrainData,
      implement: implementData,
      tractors: availableTractors,
      requiredPower,
      options: { limit: 5 },
    });
    
    // 6. Verificar si hay recomendaciones
    if (!recommendationResult.success || recommendationResult.recommendations.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Cálculo realizado pero sin tractores compatibles',
        data: {
          queryId: null,
          implement: {
            id: implement.implement_id,
            name: implement.implement_name,
            brand: implement.brand,
            type: implement.implement_type,
          },
          terrain: {
            id: terrain.terrain_id,
            name: terrain.name,
            soil_type: terrain.soil_type,
            slope_percentage: terrain.slope_percentage,
          },
          powerRequirement: {
            minimum_power_hp: requiredPower,
            factors: powerResult.factors,
          },
          terrainAnalysis: recommendationResult.terrainAnalysis,
          recommendations: [],
          summary: recommendationResult.summary,
        },
      });
    }
    
    // 7. Hidratar recomendaciones con explicaciones
    const hydratedRecommendations = recommendationResult.recommendations.map(rec => ({
      rank: rec.rank,
      tractor: {
        id: rec.tractor.tractor_id,
        name: rec.tractor.name,
        brand: rec.tractor.brand,
        model: rec.tractor.model,
        engine_power_hp: rec.tractor.engine_power_hp,
        traction_type: rec.tractor.traction_type,
        weight_kg: rec.tractor.weight_kg,
      },
      score: rec.score,
      compatibility: rec.compatibility,
      classification: rec.classification,
      explanation: generateExplanation(rec, recommendationResult.terrainAnalysis),
    }));
    
    // 8. Persistencia Transaccional
    await client.query('BEGIN');
    
    // A. Insertar en query (registro principal)
    const bestTractorId = hydratedRecommendations[0].tractor.id;
    
    const insertQuerySql = `
      INSERT INTO query (
        user_id, terrain_id, tractor_id, implement_id, query_type, status
      )
      VALUES ($1, $2, $3, $4, 'recommendation', 'completed')
      RETURNING query_id
    `;
    const queryResult = await client.query(insertQuerySql, [
      user_id, terrain_id, bestTractorId, implement_id,
    ]);
    const queryId = queryResult.rows[0].query_id;
    
    // B. Insertar Top 3 en tabla recommendation (snapshot)
    const recommendationsToSave = hydratedRecommendations.slice(0, MAX_PERSISTED_RECOMMENDATIONS);
    
    for (const rec of recommendationsToSave) {
      const observations = JSON.stringify({
        rank: rec.rank,
        score: rec.score,
        compatibility: rec.compatibility,
        classification: rec.classification,
        explanation: rec.explanation,
        powerRequirement: {
          minimum_hp: requiredPower,
          factors: powerResult.factors,
        },
        snapshot: {
          tractor: rec.tractor,
          terrain: {
            id: terrain.terrain_id,
            name: terrain.name,
            soil_type: terrain.soil_type,
            slope_percentage: terrain.slope_percentage,
          },
          implement: {
            id: implement.implement_id,
            name: implement.implement_name,
            type: implement.implement_type,
          },
        },
      });
      
      await client.query(`
        INSERT INTO recommendation (
          user_id, terrain_id, tractor_id, implement_id,
          compatibility_score, observations, work_type
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        user_id,
        terrain_id,
        rec.tractor.id,
        implement_id,
        rec.score.total,
        observations,
        work_type || WORK_TYPES.GENERAL,
      ]);
    }
    
    // C. Insertar en query_history (auditoría)
    const historyData = {
      queryId,
      powerRequirement: powerResult,
      terrainAnalysis: recommendationResult.terrainAnalysis,
      summary: recommendationResult.summary,
      recommendations: hydratedRecommendations.map(r => ({
        rank: r.rank,
        tractorId: r.tractor.id,
        tractorName: `${r.tractor.brand} ${r.tractor.model}`,
        score: r.score.total,
        classification: r.classification.label,
      })),
    };
    
    const description = `Recomendación: ${implement.implement_name} en ${terrain.name}`;
    
    await client.query(`
      INSERT INTO query_history (
        user_id, query_id, action_type, description, result_json
      )
      VALUES ($1, $2, 'recommendation', $3, $4)
    `, [user_id, queryId, description, JSON.stringify(historyData)]);
    
    // Confirmar transacción
    await client.query('COMMIT');
    
    // 9. Respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Recomendaciones generadas exitosamente',
      data: {
        queryId,
        implement: {
          id: implement.implement_id,
          name: implement.implement_name,
          brand: implement.brand,
          type: implement.implement_type,
          power_requirement_hp: implement.power_requirement_hp,
        },
        terrain: {
          id: terrain.terrain_id,
          name: terrain.name,
          soil_type: terrain.soil_type,
          slope_percentage: terrain.slope_percentage,
          analysis: recommendationResult.terrainAnalysis,
        },
        powerRequirement: {
          minimum_power_hp: requiredPower,
          calculated_power_hp: powerResult.calculatedPowerHP,
          factors: powerResult.factors,
        },
        recommendations: hydratedRecommendations,
        summary: {
          ...recommendationResult.summary,
          persistedCount: recommendationsToSave.length,
          bestMatch: {
            tractor: hydratedRecommendations[0].tractor,
            score: hydratedRecommendations[0].score.total,
            explanation: hydratedRecommendations[0].explanation,
          },
        },
      },
    });
    
  } catch (error) {
    // Rollback en caso de error
    await client.query('ROLLBACK');
    console.error('Error en generateRecommendation:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error procesando la solicitud de recomendación',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

/**
 * Obtiene el historial de recomendaciones del usuario
 * 
 * @route GET /api/recommendations/history
 * @access Private (JWT required)
 * 
 * @query {number} [page=1] - Número de página
 * @query {number} [limit=10] - Elementos por página
 * @query {string} [work_type] - Filtrar por tipo de trabajo
 * 
 * @returns {Object} Lista paginada de recomendaciones
 */
export const getRecommendationHistory = async (req, res) => {
  try {
    // 1. Extraer user_id del JWT
    const user_id = extractUserId(req);
    
    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
    }
    
    // 2. Extraer parámetros de paginación
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const work_type = req.query.work_type;
    
    // 3. Construir query con filtros opcionales
    let whereClause = 'WHERE r.user_id = $1';
    const queryParams = [user_id];
    
    if (work_type) {
      queryParams.push(`%${work_type}%`);
      whereClause += ` AND LOWER(r.work_type) LIKE LOWER($${queryParams.length})`;
    }
    
    // 4. Query principal con paginación
    const query = `
      SELECT 
        r.recommendation_id,
        r.compatibility_score,
        r.observations,
        r.work_type,
        r.recommendation_date,
        t.terrain_id,
        t.name as terrain_name,
        t.soil_type,
        t.slope_percentage,
        tr.tractor_id,
        tr.name as tractor_name,
        tr.brand as tractor_brand,
        tr.model as tractor_model,
        tr.engine_power_hp,
        i.implement_id,
        i.implement_name,
        i.implement_type
      FROM recommendation r
      LEFT JOIN terrain t ON r.terrain_id = t.terrain_id
      LEFT JOIN tractor tr ON r.tractor_id = tr.tractor_id
      LEFT JOIN implement i ON r.implement_id = i.implement_id
      ${whereClause}
      ORDER BY r.recommendation_date DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    
    queryParams.push(limit, offset);
    
    // 5. Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM recommendation r
      ${whereClause}
    `;
    
    // 6. Ejecutar queries en paralelo
    const [dataResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, [user_id, ...(work_type ? [`%${work_type}%`] : [])]),
    ]);
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    // 7. Formatear resultados
    const recommendations = dataResult.rows.map(row => {
      // Parsear observations si es JSON
      let parsedObservations = null;
      try {
        parsedObservations = row.observations ? JSON.parse(row.observations) : null;
      } catch {
        parsedObservations = { raw: row.observations };
      }
      
      return {
        id: row.recommendation_id,
        score: row.compatibility_score,
        work_type: row.work_type,
        date: row.recommendation_date,
        terrain: {
          id: row.terrain_id,
          name: row.terrain_name,
          soil_type: row.soil_type,
          slope_percentage: row.slope_percentage,
        },
        tractor: {
          id: row.tractor_id,
          name: row.tractor_name,
          brand: row.tractor_brand,
          model: row.tractor_model,
          engine_power_hp: row.engine_power_hp,
        },
        implement: {
          id: row.implement_id,
          name: row.implement_name,
          type: row.implement_type,
        },
        details: parsedObservations,
      };
    });
    
    // 8. Respuesta paginada
    res.status(200).json({
      success: true,
      data: {
        recommendations,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
    
  } catch (error) {
    console.error('Error en getRecommendationHistory:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error obteniendo historial de recomendaciones',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Obtiene una recomendación específica por ID
 * 
 * @route GET /api/recommendations/:id
 * @access Private (JWT required)
 * 
 * @param {number} req.params.id - ID de la recomendación
 * 
 * @returns {Object} Detalle completo de la recomendación
 */
export const getRecommendationById = async (req, res) => {
  try {
    const user_id = extractUserId(req);
    const { id } = req.params;
    
    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
    }
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de recomendación inválido',
      });
    }
    
    // Buscar recomendación con detalles completos
    const recommendation = await Recommendation.findById(parseInt(id));
    
    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recomendación no encontrada',
      });
    }
    
    // Validar que pertenezca al usuario
    if (recommendation.user_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'No tiene acceso a esta recomendación',
      });
    }
    
    // Parsear observations
    let parsedObservations = null;
    try {
      parsedObservations = recommendation.observations 
        ? JSON.parse(recommendation.observations) 
        : null;
    } catch {
      parsedObservations = { raw: recommendation.observations };
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: recommendation.recommendation_id,
        score: recommendation.compatibility_score,
        work_type: recommendation.work_type,
        date: recommendation.recommendation_date,
        terrain: {
          id: recommendation.terrain_id,
          name: recommendation.terrain_name,
          soil_type: recommendation.soil_type,
          slope_percentage: recommendation.slope_percentage,
        },
        tractor: {
          id: recommendation.tractor_id,
          name: recommendation.tractor_name,
          brand: recommendation.tractor_brand,
          model: recommendation.tractor_model,
          engine_power_hp: recommendation.engine_power_hp,
        },
        implement: recommendation.implement_id ? {
          id: recommendation.implement_id,
          name: recommendation.implement_name,
          type: recommendation.implement_type,
          power_requirement_hp: recommendation.power_requirement_hp,
        } : null,
        details: parsedObservations,
      },
    });
    
  } catch (error) {
    console.error('Error en getRecommendationById:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error obteniendo recomendación',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};


// EXPORTS


export default {
  generateRecommendation,
  getRecommendationHistory,
  getRecommendationById,
};
