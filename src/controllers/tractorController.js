import Tractor from '../models/Tractor.js';
import { asyncHandler } from '../middleware/error.middleware.js';

// Helpers de paginación
const getPaginationParams = (req) => {
  const limitParam = parseInt(req.query.limit, 10);
  const offsetParam = parseInt(req.query.offset, 10);

  const limit = Number.isNaN(limitParam) || limitParam <= 0 ? 10 : limitParam;
  const offset = Number.isNaN(offsetParam) || offsetParam < 0 ? 0 : offsetParam;

  return { limit, offset };
};

const applyPagination = (items, { limit, offset }) => {
  const total = items.length;
  const start = offset;
  const end = offset + limit;
  const data = items.slice(start, end);

  return { data, total, limit, offset };
};

export const getAllTractors = asyncHandler(async (req, res) => {
  const tractors = await Tractor.getAll();
  const { limit, offset } = getPaginationParams(req);
  const { data, total } = applyPagination(tractors, { limit, offset });

  return res.json({
    success: true,
    data,
    pagination: {
      total,
      limit,
      offset,
    },
  });
});

export const getTractorById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: 'ID de tractor inválido',
    });
  }

  const tractor = await Tractor.findById(id);

  if (!tractor) {
    return res.status(404).json({
      success: false,
      message: 'Tractor no encontrado',
    });
  }

  return res.json({
    success: true,
    data: tractor,
  });
});

export const searchTractors = asyncHandler(async (req, res) => {
  const { brand, model, minPower, maxPower } = req.query;

  // Usamos el modelo Tractor para obtener todos y filtramos en memoria
  const tractors = await Tractor.getAll();

  let filtered = tractors;

  if (brand) {
    const brandLower = brand.toLowerCase();
    filtered = filtered.filter((t) =>
      t.brand && t.brand.toLowerCase().includes(brandLower),
    );
  }

  if (model) {
    const modelLower = model.toLowerCase();
    filtered = filtered.filter((t) =>
      t.model && t.model.toLowerCase().includes(modelLower),
    );
  }

  const minPowerNum = minPower ? parseFloat(minPower) : null;
  const maxPowerNum = maxPower ? parseFloat(maxPower) : null;

  if (minPowerNum !== null && !Number.isNaN(minPowerNum)) {
    filtered = filtered.filter((t) => t.engine_power_hp >= minPowerNum);
  }

  if (maxPowerNum !== null && !Number.isNaN(maxPowerNum)) {
    filtered = filtered.filter((t) => t.engine_power_hp <= maxPowerNum);
  }

  const { limit, offset } = getPaginationParams(req);
  const { data, total } = applyPagination(filtered, { limit, offset });

  return res.json({
    success: true,
    data,
    pagination: {
      total,
      limit,
      offset,
    },
    filters: {
      brand: brand || null,
      model: model || null,
      minPower: minPowerNum,
      maxPower: maxPowerNum,
    },
  });
});

export const getAvailableTractors = asyncHandler(async (req, res) => {
  const tractors = await Tractor.getAvailable();
  const { limit, offset } = getPaginationParams(req);
  const { data, total } = applyPagination(tractors, { limit, offset });

  return res.json({
    success: true,
    data,
    pagination: {
      total,
      limit,
      offset,
    },
  });
});

export const createTractor = asyncHandler(async (req, res) => {
  const {
    name,
    brand,
    model,
    engine_power_hp,
    weight_kg,
    traction_force_kn,
    traction_type,
    tire_type,
    tire_width_mm,
    tire_diameter_mm,
    tire_pressure_psi,
    status,
  } = req.body || {};

  const payload = {
    name,
    brand,
    model,
    engine_power_hp:
      engine_power_hp !== undefined && engine_power_hp !== null
        ? Number(engine_power_hp)
        : undefined,
    weight_kg:
      weight_kg !== undefined && weight_kg !== null
        ? Number(weight_kg)
        : undefined,
    traction_force_kn:
      traction_force_kn !== undefined && traction_force_kn !== null
        ? Number(traction_force_kn)
        : undefined,
    traction_type,
    tire_type,
    tire_width_mm:
      tire_width_mm !== undefined && tire_width_mm !== null
        ? Number(tire_width_mm)
        : undefined,
    tire_diameter_mm:
      tire_diameter_mm !== undefined && tire_diameter_mm !== null
        ? Number(tire_diameter_mm)
        : undefined,
    tire_pressure_psi:
      tire_pressure_psi !== undefined && tire_pressure_psi !== null
        ? Number(tire_pressure_psi)
        : undefined,
    status,
  };

  const newTractor = await Tractor.create(payload);

  return res.status(201).json({
    success: true,
    data: newTractor,
  });
});

export const updateTractor = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: 'ID de tractor inválido',
    });
  }

  const existing = await Tractor.findById(id);

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Tractor no encontrado',
    });
  }

  const {
    name,
    brand,
    model,
    engine_power_hp,
    weight_kg,
    traction_force_kn,
    traction_type,
    tire_type,
    tire_width_mm,
    tire_diameter_mm,
    tire_pressure_psi,
    status,
  } = req.body || {};

  const updateData = {
    name,
    brand,
    model,
    engine_power_hp:
      engine_power_hp !== undefined && engine_power_hp !== null
        ? Number(engine_power_hp)
        : undefined,
    weight_kg:
      weight_kg !== undefined && weight_kg !== null
        ? Number(weight_kg)
        : undefined,
    traction_force_kn:
      traction_force_kn !== undefined && traction_force_kn !== null
        ? Number(traction_force_kn)
        : undefined,
    traction_type,
    tire_type,
    tire_width_mm:
      tire_width_mm !== undefined && tire_width_mm !== null
        ? Number(tire_width_mm)
        : undefined,
    tire_diameter_mm:
      tire_diameter_mm !== undefined && tire_diameter_mm !== null
        ? Number(tire_diameter_mm)
        : undefined,
    tire_pressure_psi:
      tire_pressure_psi !== undefined && tire_pressure_psi !== null
        ? Number(tire_pressure_psi)
        : undefined,
    status,
  };

  const updated = await Tractor.update(id, updateData);

  return res.json({
    success: true,
    data: updated,
  });
});

export const deleteTractor = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: 'ID de tractor inválido',
    });
  }

  const existing = await Tractor.findById(id);

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Tractor no encontrado',
    });
  }

  const updated = await Tractor.update(id, { status: 'inactive' });

  return res.json({
    success: true,
    data: updated,
  });
});

export default {
  getAllTractors,
  getTractorById,
  searchTractors,
  getAvailableTractors,
  createTractor,
  updateTractor,
  deleteTractor,
};
