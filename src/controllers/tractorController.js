import Tractor from '../models/Tractor.js';

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

export const getAllTractors = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in getAllTractors:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de tractores',
    });
  }
};

export const getTractorById = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in getTractorById:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el tractor',
    });
  }
};

export const searchTractors = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in searchTractors:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al buscar tractores',
    });
  }
};

export const getAvailableTractors = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in getAvailableTractors:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener tractores disponibles',
    });
  }
};

export default {
  getAllTractors,
  getTractorById,
  searchTractors,
  getAvailableTractors,
};
