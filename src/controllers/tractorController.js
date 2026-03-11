import Tractor from '../models/Tractor.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const applyPagination = (items, paginationParams) => {
  const {
    limit = 10,
    offset = 0,
    sort = null,
    order = 'asc',
    page = 1,
  } = paginationParams || {};

  // Ordenamiento dinámico
  if (sort && items.length > 0 && items[0].hasOwnProperty(sort)) {
    items.sort((a, b) => {
      let valA = a[sort];
      let valB = b[sort];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return order === 'desc' ? 1 : -1;
      if (valA > valB) return order === 'desc' ? -1 : 1;
      return 0;
    });
  }

  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = offset;
  const end = offset + limit;
  const data = items.slice(start, end);

  return { data, total, limit, page, totalPages };
};

export const getAllTractors = asyncHandler(async (req, res) => {
  const tractors = await Tractor.getAll();
  const { data, total, limit, page, totalPages } = applyPagination(tractors, req.pagination);

  return res.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
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
  const { brand, model, minPower, maxPower, search, type, area } = req.query;

  // Usamos el modelo Tractor para obtener todos y filtramos en memoria
  const tractors = await Tractor.getAll();

  let filtered = tractors;

  // Búsqueda general en nombre o marca
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter((t) =>
      (t.name && t.name.toLowerCase().includes(searchLower)) ||
      (t.brand && t.brand.toLowerCase().includes(searchLower))
    );
  }

  // Filtro exacto o dinámico por brand
  if (brand) {
    const brandLower = brand.toLowerCase();
    filtered = filtered.filter((t) =>
      t.brand && t.brand.toLowerCase() === brandLower
    );
  }

  if (model) {
    const modelLower = model.toLowerCase();
    filtered = filtered.filter((t) =>
      t.model && t.model.toLowerCase().includes(modelLower),
    );
  }

  // type y area (si aplica a tractores)
  if (type) {
    const typeLower = type.toLowerCase();
    filtered = filtered.filter((t) =>
      t.traction_type && t.traction_type.toLowerCase() === typeLower
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

  const { data, total, limit, page, totalPages } = applyPagination(filtered, req.pagination);

  return res.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
    filters: {
      search: search || null,
      brand: brand || null,
      model: model || null,
      type: type || null,
      area: area || null,
      minPower: minPowerNum,
      maxPower: maxPowerNum,
    },
  });
});

export const getAvailableTractors = asyncHandler(async (req, res) => {
  const tractors = await Tractor.getAvailable();
  const { data, total, limit, page, totalPages } = applyPagination(tractors, req.pagination);

  return res.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
});

export const createTractor = asyncHandler(async (req, res) => {
  const {
    name,
    brand,
    model,
    model_year,
    engine_power_hp,
    price,
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
    model_year:
      model_year !== undefined && model_year !== null
        ? Number(model_year)
        : undefined,
    engine_power_hp:
      engine_power_hp !== undefined && engine_power_hp !== null
        ? Number(engine_power_hp)
        : undefined,
    price:
      price !== undefined && price !== null
        ? Number(price)
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
    model_year,
    engine_power_hp,
    price,
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
    model_year:
      model_year !== undefined && model_year !== null
        ? Number(model_year)
        : undefined,
    engine_power_hp:
      engine_power_hp !== undefined && engine_power_hp !== null
        ? Number(engine_power_hp)
        : undefined,
    price:
      price !== undefined && price !== null
        ? Number(price)
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
