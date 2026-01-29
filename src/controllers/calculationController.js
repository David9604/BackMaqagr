import { pool } from '../config/db.js';
import Tractor from '../models/Tractor.js';
import Terrain from '../models/Terrain.js';
import { calculateTotalLoss } from '../services/powerLossService.js';

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
