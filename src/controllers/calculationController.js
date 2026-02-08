import { pool } from '../config/db.js';
import Tractor from '../models/Tractor.js';
import Terrain from '../models/Terrain.js';
import Implement from '../models/Implement.js';
import { calculateTotalLoss } from '../services/powerLossService.js';
import { calculateMinimumPower as calcMinPower } from '../services/minimumPowerService.js';

/**
 * Mapea tipo de suelo a Índice de Cono (Cn) según ASABE D497.7
 * @param {string} soil - Tipo de suelo
 * @returns {number} Cn (default: 35)
 */
const getSoilCn = (soil) => {
  const cn = { arcilla:45, clay:45, franco:35, loam:35, arena:25, sand:25, firme:50, firm:50, suave:20, soft:20 };
  return cn[soil?.toLowerCase()] || 35;
};

/**
 * Controlador para calcular pérdidas de potencia
 * Maneja orquestación DB, cálculo lógico y persistencia transaccional
 * @route POST /calculate-power
 */
export const calculatePowerLoss = async (req, res) => {
  // Cliente de conexión para transacción
  const client = await pool.connect();
  
  try {
    // 1. Extracción de inputs
    const { 
      tractor_id, 
      terrain_id, 
      working_speed_kmh, 
      carried_objects_weight_kg = 0,
      slippage_percent = 10,  // Default 10% si no se provee
      user_id = req.body.user_id || 1 // Fallback ID 1 (Admin) para pruebas
    } = req.body;

    // Validación básica de campos requeridos
    if (!tractor_id || !terrain_id || working_speed_kmh === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan campos requeridos: tractor_id, terrain_id, working_speed_kmh' 
      });
    }

    // 2. Consultas DB en Paralelo (Lectura inicial)
    // Nota: Usamos Promise.all para eficiencia. Si falla alguna, catch captura el error.
    const [tractor, terrain] = await Promise.all([
      Tractor.findById(tractor_id),
      Terrain.findById(terrain_id)
    ]);

    // 3. Validación de Negocio (Existencia)
    if (!tractor) {
      return res.status(404).json({ success: false, message: 'Tractor no encontrado' });
    }
    if (!terrain) {
      return res.status(404).json({ success: false, message: 'Terreno no encontrado' });
    }

    // 4. Preparación de parámetros para el Servicio de Cálculo
    const totalWeight = parseFloat(tractor.weight_kg) + parseFloat(carried_objects_weight_kg);
    const soilCn = getSoilCn(terrain.soil_type);
    
    // Construir objeto de parámetros
    const calculationParams = {
      enginePower: parseFloat(tractor.engine_power_hp),
      altitudeMeters: parseFloat(terrain.altitude_meters),
      temperatureC: parseFloat(terrain.temperature_celsius || 15), // Default 15°C si null
      totalWeightKg: totalWeight,
      soilCn: soilCn,
      slopePercent: parseFloat(terrain.slope_percentage),
      speedKmh: parseFloat(working_speed_kmh),
      slippagePercent: parseFloat(slippage_percent)
    };

    // Ejecutar lógica de negocio pura (Cálculo)
    const results = calculateTotalLoss(calculationParams);

    // 5. Persistencia Transaccional
    // Iniciamos la transacción SQL
    await client.query('BEGIN');

    // A. Insertar registro en tabla 'query'
    const insertQuerySql = `
      INSERT INTO query (
        user_id, terrain_id, tractor_id, working_speed_kmh, 
        carried_objects_weight_kg, query_type, status
      )
      VALUES ($1, $2, $3, $4, $5, 'power_loss', 'completed')
      RETURNING query_id
    `;
    const queryValues = [
      user_id, terrain_id, tractor_id, working_speed_kmh, carried_objects_weight_kg
    ];
    const queryResult = await client.query(insertQuerySql, queryValues);
    const queryId = queryResult.rows[0].query_id;

    // B. Insertar resultados en tabla 'power_loss'
    // Extraemos valores específicos del objeto results.losses
    const { 
      slope: slopeLoss, 
      altitude: altLoss, 
      rollingResistance: rollLoss, 
      slippage: slipLoss, 
      total: totalLoss 
    } = results.losses;

    const insertLossSql = `
      INSERT INTO power_loss (
        query_id, slope_loss_hp, altitude_loss_hp, 
        rolling_resistance_loss_hp, slippage_loss_hp, 
        total_loss_hp, available_power_hp, net_power_hp, 
        efficiency_percentage
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    const lossValues = [
      queryId, slopeLoss, altLoss, rollLoss, slipLoss,
      totalLoss, results.grossPower, results.netPower, results.efficiency
    ];
    await client.query(insertLossSql, lossValues);

    // C. Insertar log de auditoría en 'query_history'
    const insertHistorySql = `
      INSERT INTO query_history (
        user_id, query_id, action_type, description, result_json
      )
      VALUES ($1, $2, 'calculation', $3, $4)
    `;
    const description = `Cálculo de potencia: ${tractor.brand} ${tractor.model} en ${terrain.name}`;
    // Solo almacenar métricas clave (power_loss ya tiene el detalle completo)
    const historyData = { queryId, netPower: results.netPower, efficiency: results.efficiency };
    await client.query(insertHistorySql, [
      user_id, queryId, description, JSON.stringify(historyData)
    ]);

    // Confirmar transacción
    await client.query('COMMIT');

    // 6. Enviar Respuesta Exitosa
    res.status(200).json({
      success: true,
      message: 'Cálculo realizado con éxito',
      data: {
        queryId,
        tractor: { brand: tractor.brand, model: tractor.model },
        terrain: { name: terrain.name, soil_type: terrain.soil_type },
        losses: {
          slope_loss_hp: results.losses.slope,
          altitude_loss_hp: results.losses.altitude,
          rolling_resistance_loss_hp: results.losses.rollingResistance,
          slippage_loss_hp: results.losses.slippage,
          total_loss_hp: results.losses.total
        },
        net_power_hp: results.netPower,
        engine_power_hp: results.grossPower,
        efficiency_percentage: results.efficiency
      }
    });

  } catch (error) {
    // Rollback en caso de error
    await client.query('ROLLBACK');
    console.error('Error en calculatePowerLoss:', error);
    
    // Manejo de errores 500
    res.status(500).json({ 
      success: false, 
      message: 'Error procesando la solicitud de cálculo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    // Liberar cliente al pool
    client.release();
  }
};

/**
 * Constantes para clasificación de tractores por eficiencia
 * @constant {Object}
 */
const SUITABILITY_THRESHOLDS = {
  /** Rango óptimo: 100-125% de la potencia requerida */
  OPTIMAL_MAX: 1.25,
  /** Sobredimensionado: >125% de la potencia requerida */
  OVERPOWERED_MIN: 1.25,
};

/**
 * Clasifica un tractor según su eficiencia respecto a la potencia requerida
 * @param {number} tractorHP - Potencia del tractor (HP)
 * @param {number} requiredHP - Potencia mínima requerida (HP)
 * @returns {Object} Clasificación con score y label
 */
const classifyTractorSuitability = (tractorHP, requiredHP) => {
  const utilizationRatio = requiredHP / tractorHP;
  const utilizationPercent = Math.round(utilizationRatio * 100);
  
  if (tractorHP < requiredHP) {
    return {
      score: 'INSUFFICIENT',
      label: 'Potencia Insuficiente',
      color: 'red',
      utilizationPercent,
      isCompatible: false,
    };
  }
  
  if (tractorHP <= requiredHP * SUITABILITY_THRESHOLDS.OPTIMAL_MAX) {
    return {
      score: 'OPTIMAL',
      label: 'Óptimo',
      color: 'green',
      utilizationPercent,
      isCompatible: true,
    };
  }
  
  return {
    score: 'OVERPOWERED',
    label: 'Sobredimensionado',
    color: 'yellow',
    utilizationPercent,
    isCompatible: true,
  };
};

/**
 * Controlador para calcular potencia mínima requerida y recomendar tractores
 * Implementa sistema de recomendación inteligente con clasificación por eficiencia
 * 
 * @route POST /calculate-minimum-power
 * @param {Object} req.body - Datos de la solicitud
 * @param {number} req.body.implement_id - ID del implemento agrícola
 * @param {number} req.body.terrain_id - ID del terreno
 * @param {number} [req.body.working_depth_m] - Profundidad de trabajo (m), override opcional
 */
export const calculateMinimumPower = async (req, res) => {
  const client = await pool.connect();
  
  try {
    // 1. Extracción y validación de inputs (user_id viene del JWT)
    const { implement_id, terrain_id, working_depth_m } = req.body;
    const user_id = req.user?.userId || req.user?.user_id;

    // Validación de campos requeridos
    if (!implement_id || !terrain_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan campos requeridos: implement_id, terrain_id' 
      });
    }

    // 2. Consultas DB en Paralelo (Implemento, Terreno, Tractores)
    const [implement, terrain, allTractors] = await Promise.all([
      Implement.findById(implement_id),
      Terrain.findById(terrain_id),
      Tractor.getAll()
    ]);

    // 3. Validación de Negocio (Existencia de entidades)
    if (!implement) {
      return res.status(404).json({ 
        success: false, 
        message: 'Implemento no encontrado' 
      });
    }
    if (!terrain) {
      return res.status(404).json({ 
        success: false, 
        message: 'Terreno no encontrado' 
      });
    }

    // 4. Preparación de parámetros para el Servicio de Cálculo
    // Convertir working_depth_cm de BD a metros, o usar override del request
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

    // 5. Ejecutar cálculo de potencia mínima
    const powerResult = calcMinPower(implementData, terrainData);

    // 6. Clasificar tractores con sistema de recomendación inteligente
    const requiredHP = powerResult.minimumPowerHP;
    
    const classifiedTractors = allTractors
      .filter(tractor => tractor.status === 'available')
      .map(tractor => {
        const tractorHP = parseFloat(tractor.engine_power_hp);
        const suitability = classifyTractorSuitability(tractorHP, requiredHP);
        
        return {
          tractor_id: tractor.tractor_id,
          name: tractor.name,
          brand: tractor.brand,
          model: tractor.model,
          engine_power_hp: tractorHP,
          suitability,
        };
      });

    // Separar por categoría de idoneidad
    const optimalTractors = classifiedTractors.filter(t => t.suitability.score === 'OPTIMAL');
    const overpoweredTractors = classifiedTractors.filter(t => t.suitability.score === 'OVERPOWERED');
    const insufficientTractors = classifiedTractors.filter(t => t.suitability.score === 'INSUFFICIENT');

    // Top 5 recomendaciones: priorizar OPTIMAL, luego OVERPOWERED por eficiencia
    const topRecommendations = [
      ...optimalTractors.sort((a, b) => b.suitability.utilizationPercent - a.suitability.utilizationPercent),
      ...overpoweredTractors.sort((a, b) => b.suitability.utilizationPercent - a.suitability.utilizationPercent),
    ].slice(0, 5).map((t, index) => ({ ...t, rank: index + 1 }));

    // 7. Persistencia Transaccional
    await client.query('BEGIN');

    // A. Insertar en query - SIN tractor_id (usar columna que permita NULL o valor por defecto)
    // Opción: Usar el primer tractor recomendado como referencia, o modificar esquema
    const recommendedTractorId = topRecommendations.length > 0 
      ? topRecommendations[0].tractor_id 
      : null;

    // Si la BD requiere tractor_id NOT NULL, usamos el mejor recomendado
    // Si no hay tractores compatibles, no podemos insertar (o usar un valor sentinel)
    if (!recommendedTractorId) {
      // No hay tractores compatibles - aún así devolvemos resultado sin persistir
      await client.query('ROLLBACK');
      
      return res.status(200).json({
        success: true,
        message: 'Cálculo de potencia mínima realizado (sin tractores compatibles)',
        data: {
          queryId: null, // No se persistió
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
          },
          powerRequirement: {
            minimum_power_hp: powerResult.minimumPowerHP,
            calculated_power_hp: powerResult.calculatedPowerHP,
            factors: powerResult.factors,
          },
          tractorAnalysis: {
            total_evaluated: allTractors.length,
            summary: {
              optimal: 0,
              overpowered: 0,
              insufficient: insufficientTractors.length,
            },
          },
          recommendations: {
            top_5: [],
            best_match: null,
          },
        },
      });
    }

    const insertQuerySql = `
      INSERT INTO query (
        user_id, terrain_id, tractor_id, implement_id, query_type, status
      )
      VALUES ($1, $2, $3, $4, 'minimum_power', 'completed')
      RETURNING query_id
    `;
    const queryResult = await client.query(insertQuerySql, [
      user_id, terrain_id, recommendedTractorId, implement_id
    ]);
    const queryId = queryResult.rows[0].query_id;

    // B. Insertar en query_history con snapshot completo del resultado
    const historyData = {
      queryId,
      powerRequirement: powerResult,
      tractorAnalysis: {
        totalEvaluated: allTractors.length,
        optimalCount: optimalTractors.length,
        overpoweredCount: overpoweredTractors.length,
        insufficientCount: insufficientTractors.length,
      },
      topRecommendations: topRecommendations.map(t => ({
        tractor_id: t.tractor_id,
        name: t.name,
        score: t.suitability.score,
      })),
    };

    const insertHistorySql = `
      INSERT INTO query_history (
        user_id, query_id, action_type, description, result_json
      )
      VALUES ($1, $2, 'minimum_power_calculation', $3, $4)
    `;
    const description = `Cálculo de potencia mínima: ${implement.implement_name} en ${terrain.name}`;
    await client.query(insertHistorySql, [
      user_id, queryId, description, JSON.stringify(historyData)
    ]);

    await client.query('COMMIT');

    // 8. Enviar Respuesta Exitosa
    res.status(200).json({
      success: true,
      message: 'Cálculo de potencia mínima realizado con éxito',
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
        },
        powerRequirement: {
          minimum_power_hp: powerResult.minimumPowerHP,
          calculated_power_hp: powerResult.calculatedPowerHP,
          factors: powerResult.factors,
        },
        tractorAnalysis: {
          total_evaluated: allTractors.length,
          summary: {
            optimal: optimalTractors.length,
            overpowered: overpoweredTractors.length,
            insufficient: insufficientTractors.length,
          },
        },
        recommendations: {
          top_5: topRecommendations,
          best_match: topRecommendations[0] || null,
        },
      },
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en calculateMinimumPower:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Error procesando la solicitud de cálculo de potencia mínima',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
};

/**
 * Obtiene el historial de cálculos del usuario autenticado
 * Soporta paginación y filtrado por tipo de cálculo
 * 
 * @route GET /calculation-history
 * @param {Object} req.query - Parámetros de consulta
 * @param {number} [req.query.page=1] - Número de página
 * @param {number} [req.query.limit=10] - Registros por página
 * @param {string} [req.query.query_type] - Filtro: 'power_loss' | 'minimum_power' | 'recommendation'
 * @param {number} req.body.user_id - ID del usuario (en producción vendría de auth middleware)
 */
export const getCalculationHistory = async (req, res) => {
  try {
    // 1. Extracción de parámetros (user_id viene del JWT)
    const user_id = req.user?.userId || req.user?.user_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    // Soportar ambos: 'type' (semántico) y 'query_type' (legacy)
    const typeFilter = req.query.type || req.query.query_type;
    const offset = (page - 1) * limit;

    // Validación de paginación
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros de paginación inválidos (page >= 1, 1 <= limit <= 100)'
      });
    }

    // Mapeo de alias semánticos a tipos de BD
    const typeMapping = {
      'requirement': 'minimum_power',
      'minimum_power': 'minimum_power',
      'power_loss': 'power_loss',
      'recommendation': 'recommendation',
    };
    const dbQueryType = typeMapping[typeFilter?.toLowerCase()];

    // 2. Construir query SQL con filtros opcionales
    let countSql = `
      SELECT COUNT(*) as total
      FROM query_history qh
      LEFT JOIN query q ON qh.query_id = q.query_id
      WHERE qh.user_id = $1
    `;
    
    let selectSql = `
      SELECT 
        qh.history_id,
        qh.query_id,
        qh.action_date,
        qh.action_type,
        qh.description,
        qh.result_json,
        q.query_type,
        q.query_date,
        q.status,
        t.name as tractor_name,
        t.brand as tractor_brand,
        t.model as tractor_model,
        ter.name as terrain_name,
        impl.implement_name,
        impl.implement_type
      FROM query_history qh
      LEFT JOIN query q ON qh.query_id = q.query_id
      LEFT JOIN tractor t ON q.tractor_id = t.tractor_id
      LEFT JOIN terrain ter ON q.terrain_id = ter.terrain_id
      LEFT JOIN implement impl ON q.implement_id = impl.implement_id
      WHERE qh.user_id = $1
    `;

    const params = [user_id];

    // Filtro opcional por tipo de cálculo (con mapeo semántico)
    if (dbQueryType) {
      countSql += ` AND q.query_type = $2`;
      selectSql += ` AND q.query_type = $2`;
      params.push(dbQueryType);
    }

    // Ordenar por fecha descendente y aplicar paginación
    selectSql += ` ORDER BY qh.action_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    // 3. Ejecutar consultas en paralelo (count + data)
    const [countResult, historyResult] = await Promise.all([
      pool.query(countSql, params),
      pool.query(selectSql, [...params, limit, offset])
    ]);

    const totalRecords = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalRecords / limit);

    // 4. Formatear respuesta
    const history = historyResult.rows.map(row => ({
      history_id: row.history_id,
      query_id: row.query_id,
      action_date: row.action_date,
      action_type: row.action_type,
      description: row.description,
      query_type: row.query_type,
      query_date: row.query_date,
      status: row.status,
      entities: {
        tractor: row.tractor_name ? {
          name: row.tractor_name,
          brand: row.tractor_brand,
          model: row.tractor_model
        } : null,
        terrain: row.terrain_name ? {
          name: row.terrain_name
        } : null,
        implement: row.implement_name ? {
          name: row.implement_name,
          type: row.implement_type
        } : null
      },
      result_summary: row.result_json || null
    }));

    // 5. Enviar respuesta con metadata de paginación
    res.status(200).json({
      success: true,
      message: 'Historial de cálculos recuperado con éxito',
      data: {
        history,
        pagination: {
          current_page: page,
          records_per_page: limit,
          total_records: totalRecords,
          total_pages: totalPages,
          has_next_page: page < totalPages,
          has_previous_page: page > 1
        },
        filters: {
          user_id,
          type: typeFilter || 'all'
        }
      }
    });

  } catch (error) {
    console.error('Error en getCalculationHistory:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error al recuperar el historial de cálculos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
