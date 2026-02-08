import Terrain from "../models/Terrain.js";
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

// ============================================
// OPERACIONES DE TERRENO (USUARIO AUTENTICADO)
// ============================================

/**
 * Obtener todos los terrenos del usuario autenticado
 * GET /api/terrains
 */
export const getAllTerrains = asyncHandler(async (req, res) => {
  const userId = req.user.user_id;
  const terrains = await Terrain.findByUserId(userId);
  const { limit, offset } = getPaginationParams(req);
  const { data, total } = applyPagination(terrains, { limit, offset });

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

/**
 * Obtener un terreno por ID (solo si pertenece al usuario)
 * GET /api/terrains/:id
 */
export const getTerrainById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const userId = req.user.user_id;

  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: "ID de terreno inválido",
    });
  }

  // Verificar propiedad del terreno
  const terrain = await Terrain.findByIdAndUser(id, userId);

  if (!terrain) {
    return res.status(404).json({
      success: false,
      message: "Terreno no encontrado",
    });
  }

  return res.json({
    success: true,
    data: terrain,
  });
});

/**
 * Crear un nuevo terreno asociado al usuario autenticado
 * POST /api/terrains
 */
export const createTerrain = asyncHandler(async (req, res) => {
  const userId = req.user.user_id;
  const {
    name,
    altitude_meters,
    slope_percentage,
    soil_type,
    temperature_celsius,
    status,
  } = req.body || {};

  // Validaciones básicas
  const errors = [];
  if (!name || typeof name !== "string" || !name.trim()) {
    errors.push("name es requerido");
  }
  if (altitude_meters === undefined || altitude_meters === null) {
    errors.push("altitude_meters es requerido");
  }
  if (slope_percentage === undefined || slope_percentage === null) {
    errors.push("slope_percentage es requerido");
  }
  if (!soil_type || typeof soil_type !== "string" || !soil_type.trim()) {
    errors.push("soil_type es requerido");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  const payload = {
    user_id: userId,
    name,
    altitude_meters: Number(altitude_meters),
    slope_percentage: Number(slope_percentage),
    soil_type,
    temperature_celsius:
      temperature_celsius !== undefined && temperature_celsius !== null
        ? Number(temperature_celsius)
        : null,
    status,
  };

  const newTerrain = await Terrain.create(payload);

  return res.status(201).json({
    success: true,
    message: "Terreno creado exitosamente",
    data: newTerrain,
  });
});

/**
 * Actualizar un terreno (solo si pertenece al usuario)
 * PUT /api/terrains/:id
 */
export const updateTerrain = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const userId = req.user.user_id;

  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: "ID de terreno inválido",
    });
  }

  // Verificar propiedad del terreno
  const existing = await Terrain.findByIdAndUser(id, userId);

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: "Terreno no encontrado",
    });
  }

  const {
    name,
    altitude_meters,
    slope_percentage,
    soil_type,
    temperature_celsius,
    status,
  } = req.body || {};

  const updateData = {
    name,
    altitude_meters:
      altitude_meters !== undefined && altitude_meters !== null
        ? Number(altitude_meters)
        : undefined,
    slope_percentage:
      slope_percentage !== undefined && slope_percentage !== null
        ? Number(slope_percentage)
        : undefined,
    soil_type,
    temperature_celsius:
      temperature_celsius !== undefined && temperature_celsius !== null
        ? Number(temperature_celsius)
        : undefined,
    status,
  };

  const updated = await Terrain.update(id, updateData);

  return res.json({
    success: true,
    message: "Terreno actualizado exitosamente",
    data: updated,
  });
});

/**
 * Eliminar un terreno (solo si pertenece al usuario)
 * DELETE /api/terrains/:id
 */
export const deleteTerrain = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const userId = req.user.user_id;

  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: "ID de terreno inválido",
    });
  }

  // Verificar propiedad del terreno
  const existing = await Terrain.findByIdAndUser(id, userId);

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: "Terreno no encontrado",
    });
  }

  // Eliminación real (no soft delete como en tractores/implementos)
  const deleted = await Terrain.delete(id);

  return res.json({
    success: true,
    message: "Terreno eliminado exitosamente",
    data: deleted,
  });
});

export default {
  getAllTerrains,
  getTerrainById,
  createTerrain,
  updateTerrain,
  deleteTerrain,
};
