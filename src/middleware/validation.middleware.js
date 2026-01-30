const ALLOWED_TRACTION_TYPES = ['4x2', '4x4', 'track'];
const ALLOWED_STATUS = ['available', 'maintenance', 'inactive'];

export const validateTractor = (req, res, next) => {
  const errors = [];
  const {
    brand,
    model,
    engine_power_hp,
    weight_kg,
    fuel_tank_l,
    traction_type,
    status,
  } = req.body || {};

  const isCreate = req.method === 'POST';

  if (isCreate) {
    if (!brand || typeof brand !== 'string' || !brand.trim()) {
      errors.push('brand es requerido');
    }

    if (!model || typeof model !== 'string' || !model.trim()) {
      errors.push('model es requerido');
    }

    if (
      engine_power_hp === undefined ||
      engine_power_hp === null ||
      `${engine_power_hp}`.trim() === ''
    ) {
      errors.push('engine_power_hp es requerido');
    }

    if (!traction_type || typeof traction_type !== 'string' || !traction_type.trim()) {
      errors.push('traction_type es requerido');
    }
  } else {
    if (brand !== undefined && (!brand || !`${brand}`.trim())) {
      errors.push('brand no puede estar vacío');
    }

    if (model !== undefined && (!model || !`${model}`.trim())) {
      errors.push('model no puede estar vacío');
    }
  }

  const positiveFields = [
    { name: 'engine_power_hp', value: engine_power_hp },
    { name: 'weight_kg', value: weight_kg },
    { name: 'fuel_tank_l', value: fuel_tank_l },
  ];

  positiveFields.forEach(({ name, value }) => {
    if (value !== undefined && value !== null && `${value}`.trim() !== '') {
      const num = Number(value);
      if (Number.isNaN(num) || num <= 0) {
        errors.push(`${name} debe ser un número positivo`);
      }
    }
  });

  if (traction_type !== undefined && traction_type !== null && `${traction_type}`.trim() !== '') {
    if (!ALLOWED_TRACTION_TYPES.includes(traction_type)) {
      errors.push(`traction_type debe ser uno de: ${ALLOWED_TRACTION_TYPES.join(', ')}`);
    }
  }

  if (status !== undefined && status !== null && `${status}`.trim() !== '') {
    if (!ALLOWED_STATUS.includes(status)) {
      errors.push(`status debe ser uno de: ${ALLOWED_STATUS.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  return next();
};

export default {
  validateTractor,
};
