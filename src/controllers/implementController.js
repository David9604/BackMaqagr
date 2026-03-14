import Implement from "../models/Implement.js";
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

export const getAllImplements = asyncHandler(async (req, res) => {
  const implementsList = await Implement.getAll();
  const { data, total, limit, page, totalPages } = applyPagination(
    implementsList,
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

export const getImplementById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: "ID de implemento inválido",
    });
  }

  const implementItem = await Implement.findById(id);

  if (!implementItem) {
    return res.status(404).json({
      success: false,
      message: "Implemento no encontrado",
    });
  }

  return res.json({
    success: true,
    data: implementItem,
  });
});

import Tractor from "../models/Tractor.js";

export const searchImplements = asyncHandler(async (req, res) => {
  const { q, type, minWidth, maxWidth, requiredPower, tractorId } = req.query;
  const { limit, offset, page, sort, order } = req.pagination;

  const minWidthNum = minWidth ? parseFloat(minWidth) : null;
  const maxWidthNum = maxWidth ? parseFloat(maxWidth) : null;
  const requiredPowerNum = requiredPower ? parseFloat(requiredPower) : null;

  // Validate numeric filters
  if (minWidth && (Number.isNaN(minWidthNum) || minWidthNum < 0)) {
    return res.status(400).json({
      success: false,
      message: "minWidth debe ser un número positivo",
    });
  }

  if (maxWidth && (Number.isNaN(maxWidthNum) || maxWidthNum < 0)) {
    return res.status(400).json({
      success: false,
      message: "maxWidth debe ser un número positivo",
    });
  }

  if (
    minWidthNum !== null &&
    maxWidthNum !== null &&
    minWidthNum > maxWidthNum
  ) {
    return res.status(400).json({
      success: false,
      message: "minWidth no puede ser mayor que maxWidth",
    });
  }

  if (
    requiredPower &&
    (Number.isNaN(requiredPowerNum) || requiredPowerNum < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "requiredPower debe ser un número positivo",
    });
  }

  let tractorPower = null;
  if (tractorId) {
    const parsedTractorId = parseInt(tractorId, 10);
    if (Number.isNaN(parsedTractorId) || parsedTractorId <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID de tractor inválido",
      });
    }

    const tractor = await Tractor.findById(parsedTractorId);
    if (!tractor) {
      return res.status(404).json({
        success: false,
        message: "Tractor referenciado no encontrado",
      });
    }

    tractorPower = tractor.engine_power_hp;
  }

  const filters = {
    q: q || null,
    type: type || null,
    minWidth: minWidthNum,
    maxWidth: maxWidthNum,
    requiredPower: requiredPowerNum,
    limit,
    offset,
    sort,
    order,
  };

  const { data, total } = await Implement.advancedSearch(filters, tractorPower);
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
      type: type || null,
      minWidth: minWidthNum,
      maxWidth: maxWidthNum,
      requiredPower: requiredPowerNum,
      tractorId: tractorId ? parseInt(tractorId, 10) : null,
    },
  });
});

export const getAvailableImplements = asyncHandler(async (req, res) => {
  const implementsList = await Implement.getAvailable();
  const { data, total, limit, page, totalPages } = applyPagination(
    implementsList,
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

  // Validaciones de negocio
  if (
    power_requirement_hp !== undefined &&
    (Number(power_requirement_hp) < 10 || Number(power_requirement_hp) > 500)
  ) {
    return res.status(400).json({
      success: false,
      message: "La potencia requerida debe estar entre 10 y 500 HP",
    });
  }

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
    message: "Implemento creado exitosamente",
    data: newImplement,
  });
});

export const updateImplement = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: "ID de implemento inválido",
    });
  }

  const existing = await Implement.findById(id);

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: "Implemento no encontrado",
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

  // Validaciones de negocio
  if (
    power_requirement_hp !== undefined &&
    (Number(power_requirement_hp) < 10 || Number(power_requirement_hp) > 500)
  ) {
    return res.status(400).json({
      success: false,
      message: "La potencia requerida debe estar entre 10 y 500 HP",
    });
  }

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
    message: "Implemento actualizado exitosamente",
    data: updated,
  });
});

export const deleteImplement = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: "ID de implemento inválido",
    });
  }

  const existing = await Implement.findById(id);

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: "Implemento no encontrado",
    });
  }

  // Soft delete - cambiar status a 'inactive'
  const updated = await Implement.update(id, { status: "inactive" });

  return res.json({
    success: true,
    message: "Implemento eliminado exitosamente",
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
