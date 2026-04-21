import Implement from "../models/Implement.js";
import { asyncHandler } from "../middleware/error.middleware.js";
import { applyPagination } from "../utils/pagination.util.js";
import { uploadToGCS, deleteFromGCS, extractGCSPath } from '../config/storage.js';
import logger from '../utils/logger.js';

export const getAllImplements = asyncHandler(async (req, res) => {
  const implementsList = await Implement.getAll();
  const { limit = 10, sort = null, order = "asc", page = 1 } = req.pagination || {};

  const sortedRows = [...implementsList];

  if (sort && sortedRows.length > 0 && Object.prototype.hasOwnProperty.call(sortedRows[0], sort)) {
    sortedRows.sort((a, b) => {
      let valA = a[sort];
      let valB = b[sort];

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return order === "desc" ? 1 : -1;
      if (valA > valB) return order === "desc" ? -1 : 1;
      return 0;
    });
  }

  const startIndex = (page - 1) * limit;
  const rows = sortedRows.slice(startIndex, startIndex + limit);
  const { data, pagination } = applyPagination(rows, sortedRows.length, page, limit);

  return res.json({
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages: pagination.pages,
    },
  });
});

export const getImplementById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "ID de implemento inválido",
    });
  }

  const implementItem = await Implement.findById(id);

  if (!implementItem) {
    return res.status(404).json({
      success: false,
      code: "NOT_FOUND",
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
  const { limit, page, sort, order } = req.pagination;
  const offset = (page - 1) * limit;

  const minWidthNum = minWidth ? parseFloat(minWidth) : null;
  const maxWidthNum = maxWidth ? parseFloat(maxWidth) : null;
  const requiredPowerNum = requiredPower ? parseFloat(requiredPower) : null;

  // Validate numeric filters
  if (minWidth && (Number.isNaN(minWidthNum) || minWidthNum < 0)) {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "minWidth debe ser un número positivo",
    });
  }

  if (maxWidth && (Number.isNaN(maxWidthNum) || maxWidthNum < 0)) {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
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
      code: "VALIDATION_ERROR",
      message: "minWidth no puede ser mayor que maxWidth",
    });
  }

  if (
    requiredPower &&
    (Number.isNaN(requiredPowerNum) || requiredPowerNum < 0)
  ) {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "requiredPower debe ser un número positivo",
    });
  }

  let tractorPower = null;
  if (tractorId) {
    const parsedTractorId = parseInt(tractorId, 10);
    if (Number.isNaN(parsedTractorId) || parsedTractorId <= 0) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: "ID de tractor inválido",
      });
    }

    const tractor = await Tractor.findById(parsedTractorId);
    if (!tractor) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
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
    page,
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
  const { limit = 10, sort = null, order = "asc", page = 1 } = req.pagination || {};

  const sortedRows = [...implementsList];

  if (sort && sortedRows.length > 0 && Object.prototype.hasOwnProperty.call(sortedRows[0], sort)) {
    sortedRows.sort((a, b) => {
      let valA = a[sort];
      let valB = b[sort];

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return order === "desc" ? 1 : -1;
      if (valA > valB) return order === "desc" ? -1 : 1;
      return 0;
    });
  }

  const startIndex = (page - 1) * limit;
  const rows = sortedRows.slice(startIndex, startIndex + limit);
  const { data, pagination } = applyPagination(rows, sortedRows.length, page, limit);

  return res.json({
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages: pagination.pages,
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

  // If a file was uploaded, upload it to GCS and use the URL
  let image_url = req.body?.image_url;
  if (req.file) {
    try {
      const timestamp = Date.now();
      const originalName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const destination = `implements/${timestamp}-${originalName}`;
      image_url = await uploadToGCS(req.file.buffer, destination, req.file.mimetype);
    } catch (uploadError) {
      logger.error('Error uploading implement image', { error: uploadError.message });
      return res.status(500).json({
        success: false,
        code: 'UPLOAD_ERROR',
        message: 'Error al subir la imagen del implemento',
      });
    }
  }

  // Validaciones de negocio
  if (
    power_requirement_hp !== undefined &&
    (Number(power_requirement_hp) < 10 || Number(power_requirement_hp) > 500)
  ) {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "La potencia requerida debe estar entre 10 y 500 HP",
    });
  }

  const payload = {
    implement_name,
    brand,
    image_url,
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
      code: "VALIDATION_ERROR",
      message: "ID de implemento inválido",
    });
  }

  const existing = await Implement.findById(id);

  if (!existing) {
    return res.status(404).json({
      success: false,
      code: "NOT_FOUND",
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

  // If a new file was uploaded, upload it to GCS and replace the old image_url
  let image_url = req.body?.image_url;
  if (req.file) {
    try {
      const timestamp = Date.now();
      const originalName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const destination = `implements/${timestamp}-${originalName}`;
      image_url = await uploadToGCS(req.file.buffer, destination, req.file.mimetype);

      // Delete old image from GCS if it existed
      if (existing.image_url) {
        const oldPath = extractGCSPath(existing.image_url);
        if (oldPath) {
          deleteFromGCS(oldPath).catch(err => logger.warn('Failed to delete old implement image', { error: err.message }));
        }
      }
    } catch (uploadError) {
      logger.error('Error uploading implement image', { error: uploadError.message });
      return res.status(500).json({
        success: false,
        code: 'UPLOAD_ERROR',
        message: 'Error al subir la imagen del implemento',
      });
    }
  }

  // Validaciones de negocio
  if (
    power_requirement_hp !== undefined &&
    (Number(power_requirement_hp) < 10 || Number(power_requirement_hp) > 500)
  ) {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "La potencia requerida debe estar entre 10 y 500 HP",
    });
  }

  const updateData = {
    implement_name,
    brand,
    image_url,
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
      code: "VALIDATION_ERROR",
      message: "ID de implemento inválido",
    });
  }

  const existing = await Implement.findById(id);

  if (!existing) {
    return res.status(404).json({
      success: false,
      code: "NOT_FOUND",
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
