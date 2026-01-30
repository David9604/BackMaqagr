import Implement from '../models/Implement.js';

// Helpers de paginación (mismo patrón que tractores)
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

export const getAllImplements = async (req, res) => {
  try {
    const implementsList = await Implement.getAll();
    const { limit, offset } = getPaginationParams(req);
    const { data, total } = applyPagination(implementsList, { limit, offset });

    return res.json({
      success: true,
      data,
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error in getAllImplements:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de implementos',
    });
  }
};

export const getImplementById = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in getImplementById:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el implemento',
    });
  }
};

export const searchImplements = async (req, res) => {
  try {
    const { type, soilType, maxPower } = req.query;

    // Usamos el modelo Implement para obtener todos y filtramos en memoria
    const implementsList = await Implement.getAll();

    let filtered = implementsList;

    if (type) {
      const typeLower = type.toLowerCase();
      filtered = filtered.filter((item) =>
        item.implement_type && item.implement_type.toLowerCase().includes(typeLower),
      );
    }

    if (soilType) {
      const soilLower = soilType.toLowerCase();
      filtered = filtered.filter((item) =>
        item.soil_type && item.soil_type.toLowerCase().includes(soilLower),
      );
    }

    const maxPowerNum = maxPower ? parseFloat(maxPower) : null;

    if (maxPowerNum !== null && !Number.isNaN(maxPowerNum)) {
      filtered = filtered.filter((item) => item.power_requirement_hp <= maxPowerNum);
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
        type: type || null,
        soilType: soilType || null,
        maxPower: maxPowerNum,
      },
    });
  } catch (error) {
    console.error('Error in searchImplements:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al buscar implementos',
    });
  }
};

export const getAvailableImplements = async (req, res) => {
  try {
    const implementsList = await Implement.getAvailable();
    const { limit, offset } = getPaginationParams(req);
    const { data, total } = applyPagination(implementsList, { limit, offset });

    return res.json({
      success: true,
      data,
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error in getAvailableImplements:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener implementos disponibles',
    });
  }
};

export default {
  getAllImplements,
  getImplementById,
  searchImplements,
  getAvailableImplements,
};
