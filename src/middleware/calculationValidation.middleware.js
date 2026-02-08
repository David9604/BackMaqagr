/**
 * Middleware de validación para el cálculo de pérdida de potencia
 * Valida los datos del body antes de procesar la solicitud
 */

import { 
  isPositiveInteger, 
  isPositiveNumber, 
  isNonNegativeNumber 
} from '../utils/validators.util.js';

/**
 * Middleware para validar la solicitud de cálculo de pérdida de potencia
 * 
 * Reglas de validación:
 * - tractor_id: entero > 0
 * - terrain_id: entero > 0
 * - working_speed_kmh: número > 0 y < 40
 * - carried_objects_weight_kg: número >= 0
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
export const validatePowerLossRequest = (req, res, next) => {
  const { 
    tractor_id, 
    terrain_id, 
    working_speed_kmh, 
    carried_objects_weight_kg 
  } = req.body;

  // Validar tractor_id: debe ser entero > 0
  if (tractor_id === undefined || tractor_id === null) {
    return res.status(400).json({ error: 'tractor_id es requerido' });
  }
  if (!isPositiveInteger(tractor_id)) {
    return res.status(400).json({ error: 'tractor_id debe ser un entero mayor a 0' });
  }

  // Validar terrain_id: debe ser entero > 0
  if (terrain_id === undefined || terrain_id === null) {
    return res.status(400).json({ error: 'terrain_id es requerido' });
  }
  if (!isPositiveInteger(terrain_id)) {
    return res.status(400).json({ error: 'terrain_id debe ser un entero mayor a 0' });
  }

  // Validar working_speed_kmh: debe ser número > 0 y < 40
  if (working_speed_kmh === undefined || working_speed_kmh === null) {
    return res.status(400).json({ error: 'working_speed_kmh es requerido' });
  }
  if (!isPositiveNumber(working_speed_kmh)) {
    return res.status(400).json({ error: 'working_speed_kmh debe ser un número mayor a 0' });
  }
  const speedNum = Number(working_speed_kmh);
  if (speedNum >= 40) {
    return res.status(400).json({ error: 'working_speed_kmh debe ser menor a 40 km/h (velocidad agrícola razonable)' });
  }

  // Validar carried_objects_weight_kg: debe ser número >= 0
  if (carried_objects_weight_kg === undefined || carried_objects_weight_kg === null) {
    return res.status(400).json({ error: 'carried_objects_weight_kg es requerido' });
  }
  if (!isNonNegativeNumber(carried_objects_weight_kg)) {
    return res.status(400).json({ error: 'carried_objects_weight_kg debe ser un número mayor o igual a 0' });
  }

  // Convertir valores a números para el controlador
  req.body.tractor_id = Number(tractor_id);
  req.body.terrain_id = Number(terrain_id);
  req.body.working_speed_kmh = Number(working_speed_kmh);
  req.body.carried_objects_weight_kg = Number(carried_objects_weight_kg);

  // Todas las validaciones pasaron
  next();
};

/**
 * Middleware para validar la solicitud de cálculo de potencia mínima de implementos
 * 
 * Reglas de validación:
 * - implement_id: entero > 0
 * - terrain_id: entero > 0
 * - working_depth_m: número > 0 y <= 1.0 (opcional, máx 1 metro)
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
export const validateImplementRequirement = (req, res, next) => {
  const { implement_id, terrain_id, working_depth_m } = req.body;

  // Validar implement_id: debe ser entero > 0
  if (implement_id === undefined || implement_id === null) {
    return res.status(400).json({ 
      success: false, 
      error: 'implement_id es requerido' 
    });
  }
  if (!isPositiveInteger(implement_id)) {
    return res.status(400).json({ 
      success: false, 
      error: 'implement_id debe ser un entero mayor a 0' 
    });
  }

  // Validar terrain_id: debe ser entero > 0
  if (terrain_id === undefined || terrain_id === null) {
    return res.status(400).json({ 
      success: false, 
      error: 'terrain_id es requerido' 
    });
  }
  if (!isPositiveInteger(terrain_id)) {
    return res.status(400).json({ 
      success: false, 
      error: 'terrain_id debe ser un entero mayor a 0' 
    });
  }

  // Validar working_depth_m (opcional): si se proporciona, debe ser número > 0 y <= 1.0
  if (working_depth_m !== undefined && working_depth_m !== null) {
    if (!isPositiveNumber(working_depth_m)) {
      return res.status(400).json({ 
        success: false, 
        error: 'working_depth_m debe ser un número mayor a 0' 
      });
    }
    const depthNum = Number(working_depth_m);
    if (depthNum > 1.0) {
      return res.status(400).json({ 
        success: false, 
        error: 'working_depth_m no puede exceder 1.0 metros (profundidad agrícola máxima)' 
      });
    }
    req.body.working_depth_m = depthNum;
  }

  // Convertir IDs a números
  req.body.implement_id = Number(implement_id);
  req.body.terrain_id = Number(terrain_id);

  next();
};

export default validatePowerLossRequest;
