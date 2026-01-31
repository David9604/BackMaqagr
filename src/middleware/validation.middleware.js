const ALLOWED_TRACTION_TYPES = ['4x2', '4x4', 'track'];
const ALLOWED_STATUS = ['available', 'maintenance', 'inactive'];
const ALLOWED_IMPLEMENT_TYPES = ['plow', 'harrow', 'seeder', 'sprayer', 'harvester', 'cultivator', 'mower', 'trailer', 'other'];

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

// ============================================
// VALIDACIÓN DE IMPLEMENTOS
// ============================================

export const validateImplement = (req, res, next) => {
  const errors = [];
  const {
    implement_name,
    brand,
    power_requirement_hp,
    working_width_m,
    working_depth_cm,
    weight_kg,
    implement_type,
    status,
  } = req.body || {};

  const isCreate = req.method === 'POST';

  // Campos requeridos en creación
  if (isCreate) {
    if (!implement_name || typeof implement_name !== 'string' || !implement_name.trim()) {
      errors.push('implement_name es requerido');
    }

    if (!brand || typeof brand !== 'string' || !brand.trim()) {
      errors.push('brand es requerido');
    }

    if (
      power_requirement_hp === undefined ||
      power_requirement_hp === null ||
      `${power_requirement_hp}`.trim() === ''
    ) {
      errors.push('power_requirement_hp es requerido');
    }

    if (
      working_width_m === undefined ||
      working_width_m === null ||
      `${working_width_m}`.trim() === ''
    ) {
      errors.push('working_width_m es requerido');
    }

    if (!implement_type || typeof implement_type !== 'string' || !implement_type.trim()) {
      errors.push('implement_type es requerido');
    }
  } else {
    // Validación para actualización - campos no pueden estar vacíos si se envían
    if (implement_name !== undefined && (!implement_name || !`${implement_name}`.trim())) {
      errors.push('implement_name no puede estar vacío');
    }

    if (brand !== undefined && (!brand || !`${brand}`.trim())) {
      errors.push('brand no puede estar vacío');
    }
  }

  // Validar campos numéricos positivos
  const positiveFields = [
    { name: 'power_requirement_hp', value: power_requirement_hp },
    { name: 'working_width_m', value: working_width_m },
    { name: 'working_depth_cm', value: working_depth_cm },
    { name: 'weight_kg', value: weight_kg },
  ];

  positiveFields.forEach(({ name, value }) => {
    if (value !== undefined && value !== null && `${value}`.trim() !== '') {
      const num = Number(value);
      if (Number.isNaN(num) || num <= 0) {
        errors.push(`${name} debe ser un número positivo`);
      }
    }
  });

  // Validar enum implement_type
  if (implement_type !== undefined && implement_type !== null && `${implement_type}`.trim() !== '') {
    if (!ALLOWED_IMPLEMENT_TYPES.includes(implement_type)) {
      errors.push(`implement_type debe ser uno de: ${ALLOWED_IMPLEMENT_TYPES.join(', ')}`);
    }
  }

  // Validar enum status
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
  validateImplement,
};
