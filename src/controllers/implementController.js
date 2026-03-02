import Implement from '../models/Implement.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const applyPagination = (items, paginationParams) => {
  const { limit, offset, sort, order, page } = paginationParams;

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

export const getAllImplements = asyncHandler(async (req, res) => {
  const implementsList = await Implement.getAll();
  const { data, total, limit, page, totalPages } = applyPagination(implementsList, req.pagination);

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

export const getImplementById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: 'ID de implemento inválido',
    });
  }

  const implementItem = await Implement.findById(id);

  if (!implementItem) {
    return res.status(404).json({
      success: false,
      message: 'Implemento no encontrado',
    });
  }

  return res.json({
    success: true,
    data: implementItem,
  });
});

export const searchImplements = asyncHandler(async (req, res) => {
  const { type, soilType, maxPower, search, brand } = req.query;

  // Usamos el modelo Implement para obtener todos y filtramos en memoria
  const implementsList = await Implement.getAll();

  let filtered = implementsList;

  // Búsqueda general por nombre o marca
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter((item) =>
      (item.implement_name && item.implement_name.toLowerCase().includes(searchLower)) ||
      (item.brand && item.brand.toLowerCase().includes(searchLower))
    );
  }

  // Filtro exacto por marca
  if (brand) {
    const brandLower = brand.toLowerCase();
    filtered = filtered.filter((item) =>
      item.brand && item.brand.toLowerCase() === brandLower
    );
  }

  // Filtro exacto (o generalizando type)
  if (type) {
    const typeLower = type.toLowerCase();
    filtered = filtered.filter((item) =>
      item.implement_type && item.implement_type.toLowerCase() === typeLower
    );
  }

  if (soilType) {
    const soilLower = soilType.toLowerCase();
    filtered = filtered.filter((item) =>
      item.soil_type && item.soil_type.toLowerCase().includes(soilLower)
    );
  }

  const maxPowerNum = maxPower ? parseFloat(maxPower) : null;

  if (maxPowerNum !== null && !Number.isNaN(maxPowerNum)) {
    filtered = filtered.filter((item) => item.power_requirement_hp <= maxPowerNum);
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
      type: type || null,
      soilType: soilType || null,
      maxPower: maxPowerNum,
    },
  });
});

export const getAvailableImplements = asyncHandler(async (req, res) => {
  const implementsList = await Implement.getAvailable();
  const { data, total, limit, page, totalPages } = applyPagination(implementsList, req.pagination);

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

// ============================================
// OPERACIONES DE ESCRITURA (ADMIN)
// ============================================

export const createImplement = asyncHandler(async (req, res) => {
  const {
    implement_name,
    brand,
    power_requirement_hp,
    working_width_m,
    soil_type,
    working_depth_cm,
    weight_kg,
    implement_type,
    status,
  } = req.body || {};

  const payload = {
    implement_name,
    brand,
    power_requirement_hp:
      power_requirement_hp !== undefined && power_requirement_hp !== null
        ? Number(power_requirement_hp)
        : undefined,
    working_width_m:
      working_width_m !== undefined && working_width_m !== null
        ? Number(working_width_m)
        : undefined,
    soil_type,
    working_depth_cm:
      working_depth_cm !== undefined && working_depth_cm !== null
        ? Number(working_depth_cm)
        : undefined,
    weight_kg:
      weight_kg !== undefined && weight_kg !== null
        ? Number(weight_kg)
        : undefined,
    implement_type,
    status,
  };

  const newImplement = await Implement.create(payload);

  return res.status(201).json({
    success: true,
    message: 'Implemento creado exitosamente',
    data: newImplement,
  });
});

export const updateImplement = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: 'ID de implemento inválido',
    });
  }

  const existing = await Implement.findById(id);

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Implemento no encontrado',
    });
  }

  const {
    implement_name,
    brand,
    power_requirement_hp,
    working_width_m,
    soil_type,
    working_depth_cm,
    weight_kg,
    implement_type,
    status,
  } = req.body || {};

  const updateData = {
    implement_name,
    brand,
    power_requirement_hp:
      power_requirement_hp !== undefined && power_requirement_hp !== null
        ? Number(power_requirement_hp)
        : undefined,
    working_width_m:
      working_width_m !== undefined && working_width_m !== null
        ? Number(working_width_m)
        : undefined,
    soil_type,
    working_depth_cm:
      working_depth_cm !== undefined && working_depth_cm !== null
        ? Number(working_depth_cm)
        : undefined,
    weight_kg:
      weight_kg !== undefined && weight_kg !== null
        ? Number(weight_kg)
        : undefined,
    implement_type,
    status,
  };

  const updated = await Implement.update(id, updateData);

  return res.json({
    success: true,
    message: 'Implemento actualizado exitosamente',
    data: updated,
  });
});

export const deleteImplement = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: 'ID de implemento inválido',
    });
  }

  const existing = await Implement.findById(id);

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Implemento no encontrado',
    });
  }

  // Soft delete - cambiar status a 'inactive'
  const updated = await Implement.update(id, { status: 'inactive' });

  return res.json({
    success: true,
    message: 'Implemento eliminado exitosamente',
    data: updated,
  });
});

export default {
  getAllImplements,
  getImplementById,
  searchImplements,
  getAvailableImplements,
  createImplement,
  updateImplement,
  deleteImplement,
};
