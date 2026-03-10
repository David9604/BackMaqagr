import Tractor from "../models/Tractor.js";
import Recommendation from "../models/Recommendation.js";
import { asyncHandler } from "../middleware/error.middleware.js";

const applyPagination = (items, paginationParams) => {
  const { limit, offset, sort, order, page } = paginationParams;

  // Ordenamiento dinámico
  if (sort && items.length > 0 && items[0].hasOwnProperty(sort)) {
    items.sort((a, b) => {
      let valA = a[sort];
      let valB = b[sort];

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return order === "desc" ? 1 : -1;
      if (valA > valB) return order === "desc" ? -1 : 1;
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
  const { data, total, limit, page, totalPages } = applyPagination(
    tractors,
    req.pagination,
  );

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
      message: "ID de tractor inválido",
    });
  }

  const tractor = await Tractor.findById(id);

  if (!tractor) {
    return res.status(404).json({
      success: false,
      message: "Tractor no encontrado",
    });
  }

  return res.json({
    success: true,
    data: tractor,
  });
});

export const searchTractors = asyncHandler(async (req, res) => {
  const { q, brand, minPower, maxPower, type } = req.query;
  const { limit, offset, page, sort, order } = req.pagination;

  const minPowerNum = minPower ? parseFloat(minPower) : null;
  const maxPowerNum = maxPower ? parseFloat(maxPower) : null;

  // Validate numeric filters
  if (minPower && (Number.isNaN(minPowerNum) || minPowerNum < 0)) {
    return res.status(400).json({
      success: false,
      message: "minPower debe ser un número positivo",
    });
  }

  if (maxPower && (Number.isNaN(maxPowerNum) || maxPowerNum < 0)) {
    return res.status(400).json({
      success: false,
      message: "maxPower debe ser un número positivo",
    });
  }

  if (
    minPowerNum !== null &&
    maxPowerNum !== null &&
    minPowerNum > maxPowerNum
  ) {
    return res.status(400).json({
      success: false,
      message: "minPower no puede ser mayor que maxPower",
    });
  }

  const filters = {
    q: q || null,
    brand: brand || null,
    minPower: minPowerNum,
    maxPower: maxPowerNum,
    type: type || null,
    limit,
    offset,
    sort,
    order,
  };

  const { data, total } = await Tractor.advancedSearch(filters);
  const totalPages = Math.ceil(total / limit);

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
      q: q || null,
      brand: brand || null,
      minPower: minPowerNum,
      maxPower: maxPowerNum,
      type: type || null,
    },
  });
});

export const getAvailableTractors = asyncHandler(async (req, res) => {
  const tractors = await Tractor.getAvailable();
  const { data, total, limit, page, totalPages } = applyPagination(
    tractors,
    req.pagination,
  );

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

  // Validaciones de negocio
  if (
    engine_power_hp !== undefined &&
    (Number(engine_power_hp) < 10 || Number(engine_power_hp) > 500)
  ) {
    return res.status(400).json({
      success: false,
      message: "La potencia del motor debe estar entre 10 y 500 HP",
    });
  }

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
      message: "ID de tractor inválido",
    });
  }

  const existing = await Tractor.findById(id);

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: "Tractor no encontrado",
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

  // Validaciones de negocio
  if (
    engine_power_hp !== undefined &&
    (Number(engine_power_hp) < 10 || Number(engine_power_hp) > 500)
  ) {
    return res.status(400).json({
      success: false,
      message: "La potencia del motor debe estar entre 10 y 500 HP",
    });
  }

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
      message: "ID de tractor inválido",
    });
  }

  const existing = await Tractor.findById(id);

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: "Tractor no encontrado",
    });
  }

  // Verificar si tiene recomendaciones activas
  const recommendations = await Recommendation.findByTractor(id);
  if (recommendations && recommendations.length > 0) {
    return res.status(400).json({
      success: false,
      message:
        "No se puede eliminar el tractor porque tiene recomendaciones asociadas",
    });
  }

  const updated = await Tractor.update(id, { status: "inactive" });

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
