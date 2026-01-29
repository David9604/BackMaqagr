/**
 * Middleware de validación para el cálculo de pérdida de potencia
 * Valida los datos del body antes de procesar la solicitud
 */

/**
 * Valida que un valor sea un entero positivo mayor a 0
 * @param {any} value - Valor a validar
 * @returns {boolean}
 */
const isPositiveInteger = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
};

/**
 * Valida que un valor sea un número positivo (puede ser decimal)
 * @param {any} value - Valor a validar
 * @returns {boolean}
 */
const isPositiveNumber = (value) => {
  const num = Number(value);
  return !isNaN(num) && num > 0;
};

/**
 * Valida que un valor sea un número no negativo (>= 0)
 * @param {any} value - Valor a validar
 * @returns {boolean}
 */
const isNonNegativeNumber = (value) => {
  const num = Number(value);
  return !isNaN(num) && num >= 0;
};

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

export default validatePowerLossRequest;
