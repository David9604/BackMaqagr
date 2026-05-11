/**
 * Middleware de validación para el cálculo de pérdida de potencia
 * Valida los datos del body antes de procesar la solicitud
 */

import {
  isPositiveInteger,
  isPositiveNumber,
  isNonNegativeNumber,
  isNonEmptyString,
  isInRange
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

/**
 * Middleware para validar la solicitud de cálculo directo de pérdida de potencia
 * (Flujo "Tengo Tractor" — datos manuales sin IDs de DB)
 *
 * Reglas de validación:
 * - engine_power_hp: número > 0
 * - weight_kg: número > 0
 * - soil_type: string no vacío
 * - altitude_m: número >= 0
 * - ambient_temperature_c: número
 * - slope_percent: número >= 0
 * - slippage_percent: número 0-100
 * - has_turbo: opcional, boolean o 'si'/'no'/'true'/'false'
 * - working_speed_kmh: opcional, número > 0 y < 40 (default 7)
 * - carried_objects_weight_kg: opcional, número >= 0 (default 0)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const validateDirectPowerLossRequest = (req, res, next) => {
  const {
    engine_power_hp,
    weight_kg,
    soil_type,
    altitude_m,
    ambient_temperature_c,
    slope_percent,
    slippage_percent,
    has_turbo,
    working_speed_kmh,
    carried_objects_weight_kg,
  } = req.body;

  const errors = [];

  // Campos requeridos
  if (engine_power_hp === undefined || engine_power_hp === null) {
    errors.push('engine_power_hp es requerido');
  } else if (!isPositiveNumber(engine_power_hp)) {
    errors.push('engine_power_hp debe ser un número mayor a 0');
  }

  if (weight_kg === undefined || weight_kg === null) {
    errors.push('weight_kg es requerido');
  } else if (!isPositiveNumber(weight_kg)) {
    errors.push('weight_kg debe ser un número mayor a 0');
  }

  if (!soil_type) {
    errors.push('soil_type es requerido');
  } else if (!isNonEmptyString(soil_type)) {
    errors.push('soil_type debe ser un string no vacío');
  }

  if (altitude_m === undefined || altitude_m === null) {
    errors.push('altitude_m es requerido');
  } else if (!isNonNegativeNumber(altitude_m)) {
    errors.push('altitude_m debe ser un número mayor o igual a 0');
  }

  if (ambient_temperature_c === undefined || ambient_temperature_c === null) {
    errors.push('ambient_temperature_c es requerido');
  } else if (typeof Number(ambient_temperature_c) !== 'number' || isNaN(Number(ambient_temperature_c))) {
    errors.push('ambient_temperature_c debe ser un número');
  }

  if (slope_percent === undefined || slope_percent === null) {
    errors.push('slope_percent es requerido');
  } else if (!isNonNegativeNumber(slope_percent)) {
    errors.push('slope_percent debe ser un número mayor o igual a 0');
  }

  if (slippage_percent === undefined || slippage_percent === null) {
    errors.push('slippage_percent es requerido');
  } else if (!isInRange(slippage_percent, 0, 100)) {
    errors.push('slippage_percent debe estar entre 0 y 100');
  }

  // has_turbo: opcional, normalizar
  if (has_turbo !== undefined && has_turbo !== null) {
    const turboStr = String(has_turbo).toLowerCase();
    if (!['si', 'sí', 'no', 'true', 'false', ''].includes(turboStr) && typeof has_turbo !== 'boolean') {
      errors.push('has_turbo debe ser boolean o si/no');
    }
  }

  // working_speed_kmh: opcional
  if (working_speed_kmh !== undefined && working_speed_kmh !== null) {
    if (!isPositiveNumber(working_speed_kmh)) {
      errors.push('working_speed_kmh debe ser un número mayor a 0');
    } else if (Number(working_speed_kmh) >= 40) {
      errors.push('working_speed_kmh debe ser menor a 40 km/h');
    }
  }

  // carried_objects_weight_kg: opcional
  if (carried_objects_weight_kg !== undefined && carried_objects_weight_kg !== null) {
    if (!isNonNegativeNumber(carried_objects_weight_kg)) {
      errors.push('carried_objects_weight_kg debe ser un número mayor o igual a 0');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors,
    });
  }

  // Normalizar y asignar defaults
  req.body.engine_power_hp = Number(engine_power_hp);
  req.body.weight_kg = Number(weight_kg);
  req.body.altitude_m = Number(altitude_m);
  req.body.ambient_temperature_c = Number(ambient_temperature_c);
  req.body.slope_percent = Number(slope_percent);
  req.body.slippage_percent = Number(slippage_percent);
  req.body.working_speed_kmh = working_speed_kmh !== undefined ? Number(working_speed_kmh) : 7;
  req.body.carried_objects_weight_kg = carried_objects_weight_kg !== undefined ? Number(carried_objects_weight_kg) : 0;

  // Normalizar has_turbo a boolean
  if (has_turbo !== undefined && has_turbo !== null) {
    const turboStr = String(has_turbo).toLowerCase();
    req.body.has_turbo = turboStr === 'si' || turboStr === 'sí' || turboStr === 'true' || has_turbo === true;
  } else {
    req.body.has_turbo = false;
  }

  next();
};

export default validatePowerLossRequest;
