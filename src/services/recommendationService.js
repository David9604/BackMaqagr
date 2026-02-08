/**
 * @overview Servicio de recomendación de tractores basado en scoring ponderado
 * @module services/recommendationService
 * 
 * @description
 * "El Matchmaker Agrícola" - Servicio puro que conecta la lógica de potencia mínima
 * con el catálogo de tractores mediante un algoritmo de puntuación determinista.
 * 
 * Patrón Strategy: Filter -> Score -> Sort
 * 
 * @example
 * import { generateRecommendation } from './recommendationService.js';
 * 
 * const result = generateRecommendation({
 *   terrain: { slope_percentage: 12, soil_type: 'clay' },
 *   implement: { power_requirement_hp: 50 },
 *   tractors: tractorsList,
 *   requiredPower: 85
 * });
 */

// CONSTANTES

/**
 * Configuración del algoritmo de scoring
 * @constant {Object}
 */
const SCORING_CONFIG = {
  /** Pesos de cada criterio (deben sumar 100) */
  WEIGHTS: {
    EFFICIENCY: 30,    // Penalizar sobredimensionamiento
    TRACTION: 25,      // Bonus por tracción adecuada
    SOIL: 20,          // Compatibilidad de rodadura con suelo
    ECONOMIC: 15,      // Preferir menor consumo/cilindraje
    AVAILABILITY: 10,  // Disponibilidad del tractor
  },
  
  /** Límite superior de potencia (130% = desperdicio) */
  OVERPOWER_THRESHOLD: 1.3,
  
  /** Máximo de recomendaciones a retornar */
  TOP_RECOMMENDATIONS: 5,
};

/**
 * Clasificación de pendientes
 * @constant {Object}
 */
const SLOPE_CLASSIFICATION = {
  FLAT: { max: 5, label: 'FLAT', description: 'Terreno plano' },
  ROLLING: { min: 5, max: 15, label: 'ROLLING', description: 'Pendiente moderada' },
  STEEP: { min: 15, label: 'STEEP', description: 'Pendiente pronunciada' },
};

/**
 * Dificultad de suelos (0-100, mayor = más difícil)
 * @constant {Object}
 */
const SOIL_DIFFICULTY = {
  sandy: { difficulty: 20, label: 'Fácil', preferredTire: 'standard' },
  loam: { difficulty: 40, label: 'Moderado', preferredTire: 'standard' },
  clay: { difficulty: 70, label: 'Difícil', preferredTire: 'track' },
  rocky: { difficulty: 85, label: 'Muy difícil', preferredTire: 'reinforced' },
  wet_clay: { difficulty: 95, label: 'Extremo', preferredTire: 'track' },
};

/**
 * Mapeo bilingüe de tipos de suelo
 * @constant {Object}
 */
const SOIL_TYPE_MAPPING = {
  'arcilla': 'clay',
  'arcilloso': 'clay',
  'clay': 'clay',
  'franco': 'loam',
  'loam': 'loam',
  'arena': 'sandy',
  'arenoso': 'sandy',
  'sandy': 'sandy',
  'rocoso': 'rocky',
  'rocky': 'rocky',
  'pedregoso': 'rocky',
  'arcilla_humeda': 'wet_clay',
  'wet_clay': 'wet_clay',
};

/**
 * Bonus de tracción por tipo y condiciones
 * @constant {Object}
 */
const TRACTION_BONUS = {
  '4x4': { flat: 5, rolling: 15, steep: 25 },
  '4WD': { flat: 5, rolling: 15, steep: 25 },
  'track': { flat: 0, rolling: 20, steep: 30 },
  '4x2': { flat: 10, rolling: 0, steep: -50 }, // Penalización en pendiente
  '2WD': { flat: 10, rolling: 0, steep: -50 },
};



// FUNCIONES DE ANÁLISIS DE TERRENO


/**
 * Normaliza el tipo de suelo a un valor reconocido
 * 
 * @param {string|null|undefined} soilType - Tipo de suelo
 * @returns {string} Tipo de suelo normalizado
 */
const normalizeSoilType = (soilType) => {
  if (!soilType) return 'loam';
  const normalized = soilType.toLowerCase().trim();
  return SOIL_TYPE_MAPPING[normalized] || 'loam';
};

/**
 * Clasifica la pendiente del terreno
 * 
 * @param {number} slopePercentage - Pendiente en porcentaje
 * @returns {'FLAT'|'ROLLING'|'STEEP'} Clasificación de pendiente
 * 
 * @example
 * classifySlope(3);   // -> 'FLAT'
 * classifySlope(10);  // -> 'ROLLING'
 * classifySlope(20);  // -> 'STEEP'
 */
const classifySlope = (slopePercentage) => {
  const slope = Math.abs(slopePercentage || 0);
  
  if (slope < SLOPE_CLASSIFICATION.FLAT.max) {
    return 'FLAT';
  }
  if (slope < SLOPE_CLASSIFICATION.ROLLING.max) {
    return 'ROLLING';
  }
  return 'STEEP';
};

/**
 * Analiza las características del terreno
 * 
 * @param {Object} terrain - Datos del terreno
 * @param {number} terrain.slope_percentage - Pendiente en porcentaje
 * @param {string} terrain.soil_type - Tipo de suelo
 * @param {number} [terrain.altitude_meters] - Altitud en metros
 * @returns {Object} Análisis completo del terreno
 * 
 * @example
 * analyzeTerrain({ slope_percentage: 12, soil_type: 'clay' });
 * / {
 * /   slopeClass: 'ROLLING',
 * /   soilDifficulty: { difficulty: 70, label: 'Difícil', ... },
 * /   requires4WD: false,
 * /   ...
 * / }
 */
export const analyzeTerrain = (terrain) => {
  if (!terrain) {
    throw new Error('terrain es requerido');
  }
  
  const slopePercentage = terrain.slope_percentage || 0;
  const soilType = normalizeSoilType(terrain.soil_type);
  const slopeClass = classifySlope(slopePercentage);
  
  // Obtener dificultad del suelo
  const soilDifficulty = SOIL_DIFFICULTY[soilType] || SOIL_DIFFICULTY.loam;
  
  // Regla de Oro: pendiente > 15% requiere 4WD
  const requires4WD = slopeClass === 'STEEP';
  
  // Calcular índice de dificultad combinado (0-100)
  const slopeDifficultyIndex = slopePercentage * 2; // Max ~40 para 20%
  const combinedDifficulty = Math.min(100, 
    (soilDifficulty.difficulty * 0.6) + (slopeDifficultyIndex * 0.4)
  );
  
  return {
    original: {
      slope_percentage: slopePercentage,
      soil_type: terrain.soil_type,
      altitude_meters: terrain.altitude_meters || 0,
    },
    normalized: {
      soilType,
      slopePercentage,
    },
    classification: {
      slopeClass,
      slopeDescription: SLOPE_CLASSIFICATION[slopeClass]?.description || 'Desconocido',
      soilLabel: soilDifficulty.label,
      preferredTire: soilDifficulty.preferredTire,
    },
    metrics: {
      soilDifficulty: soilDifficulty.difficulty,
      combinedDifficulty: Math.round(combinedDifficulty * 100) / 100,
    },
    requirements: {
      requires4WD,
      requiresTrack: soilType === 'wet_clay' || (soilType === 'clay' && slopeClass === 'STEEP'),
    },
  };
};

// FUNCIONES DE FILTRADO

/**
 * Normaliza el tipo de tracción del tractor
 * 
 * @param {string} tractionType - Tipo de tracción original
 * @returns {string} Tipo normalizado ('4x4'|'4x2'|'track')
 */
const normalizeTractionType = (tractionType) => {
  if (!tractionType) return '4x2';
  const normalized = tractionType.toUpperCase().trim();
  
  if (normalized === '4WD' || normalized === '4X4') return '4x4';
  if (normalized === '2WD' || normalized === '4X2') return '4x2';
  if (normalized === 'TRACK' || normalized === 'ORUGA' || normalized === 'ORUGAS') return 'track';
  
  return '4x2';
};

/**
 * Filtra tractores compatibles con el terreno y potencia requerida
 * 
 * @description
 * Aplica filtros en cascada:
 * 1. Filtro de potencia: tractor.power >= requiredPower
 * 2. Regla de Oro: Si pendiente > 15%, excluir tractores sin 4WD
 * 3. Filtro de disponibilidad (opcional)
 * 
 * @param {Object} terrain - Datos del terreno
 * @param {Array<Object>} tractors - Lista de tractores
 * @param {number} requiredPower - Potencia mínima requerida (HP)
 * @param {Object} [options] - Opciones adicionales
 * @param {boolean} [options.includeUnavailable=false] - Incluir tractores no disponibles
 * @returns {Array<Object>} Tractores que pasan todos los filtros
 * 
 * @example
 * const compatible = findCompatibleTractors(
 *   { slope_percentage: 18, soil_type: 'clay' },
 *   tractorsList,
 *   100
 * );
 */
export const findCompatibleTractors = (terrain, tractors, requiredPower, options = {}) => {
  if (!Array.isArray(tractors)) {
    return [];
  }
  
  const terrainAnalysis = analyzeTerrain(terrain);
  const { requires4WD } = terrainAnalysis.requirements;
  const { includeUnavailable = false } = options;
  
  return tractors.filter((tractor) => {
    // Obtener potencia del tractor
    const tractorPower = tractor.engine_power_hp || tractor.enginePowerHp || 0;
    
    // Filtro 1: Potencia mínima
    if (tractorPower < requiredPower) {
      return false;
    }
    
    // Filtro 2: Regla de Oro - 4WD obligatorio en pendiente > 15%
    if (requires4WD) {
      const tractionType = normalizeTractionType(tractor.traction_type);
      if (tractionType !== '4x4' && tractionType !== 'track') {
        return false;
      }
    }
    
    // Filtro 3: Disponibilidad (opcional)
    if (!includeUnavailable) {
      const status = (tractor.status || 'available').toLowerCase();
      if (status !== 'available' && status !== 'active') {
        return false;
      }
    }
    
    return true;
  });
};



// FUNCIONES DE SCORING


/**
 * Calcula el score de eficiencia (0-30 pts)
 * 
 * @description
 * Penaliza tractores con potencia excesiva (>130% de la requerida).
 * - 100% potencia = 30 pts (máximo)
 * - 130% potencia = 15 pts
 * - >130% potencia = decrece linealmente
 * 
 * @param {number} tractorPower - Potencia del tractor (HP)
 * @param {number} requiredPower - Potencia mínima requerida (HP)
 * @returns {number} Score de eficiencia (0-30)
 */
const calculateEfficiencyScore = (tractorPower, requiredPower) => {
  const maxScore = SCORING_CONFIG.WEIGHTS.EFFICIENCY;
  const ratio = tractorPower / requiredPower;
  
  if (ratio <= 1.0) {
    // Potencia justa o insuficiente (no debería llegar aquí después del filtro)
    return maxScore;
  }
  
  if (ratio <= SCORING_CONFIG.OVERPOWER_THRESHOLD) {
    // Entre 100% y 130%: score lineal decreciente de 30 a 15
    const excess = ratio - 1.0;
    const penalty = (excess / 0.3) * (maxScore / 2);
    return Math.max(0, maxScore - penalty);
  }
  
  // Más del 130%: penalización agresiva
  const excessBeyondThreshold = ratio - SCORING_CONFIG.OVERPOWER_THRESHOLD;
  const baseScore = maxScore / 2; // 15 pts en el umbral
  const penalty = excessBeyondThreshold * 30; // 30 pts por cada 100% extra
  
  return Math.max(0, baseScore - penalty);
};

/**
 * Calcula el score de tracción (0-25 pts)
 * 
 * @description
 * Bonus según tipo de tracción y condiciones del terreno.
 * - 4WD en pendiente pronunciada = máximo bonus
 * - 2WD en terreno plano = aceptable
 * - 2WD en pendiente = penalización
 * 
 * @param {Object} tractor - Datos del tractor
 * @param {Object} terrainAnalysis - Análisis del terreno
 * @returns {number} Score de tracción (0-25)
 */
const calculateTractionScore = (tractor, terrainAnalysis) => {
  const maxScore = SCORING_CONFIG.WEIGHTS.TRACTION;
  const tractionType = normalizeTractionType(tractor.traction_type);
  const slopeClass = terrainAnalysis.classification.slopeClass.toLowerCase();
  
  // Obtener bonus base del tipo de tracción
  const tractionConfig = TRACTION_BONUS[tractionType] || TRACTION_BONUS['4x2'];
  const bonus = tractionConfig[slopeClass] || 0;
  
  // Convertir bonus (-50 a +30) a score (0-25)
  // bonus máximo = 30 -> 25 pts
  // bonus 0 = 12.5 pts
  // bonus -50 = 0 pts
  const normalizedScore = ((bonus + 50) / 80) * maxScore;
  
  return Math.max(0, Math.min(maxScore, normalizedScore));
};

/**
 * Calcula el score de compatibilidad con suelo (0-20 pts)
 * 
 * @description
 * Evalúa si el tipo de neumático/rodadura es adecuado para el suelo.
 * - Orugas en arcilla húmeda = máximo
 * - Neumáticos estándar en arena = máximo
 * - Desajuste = penalización
 * 
 * @param {Object} tractor - Datos del tractor
 * @param {Object} terrainAnalysis - Análisis del terreno
 * @returns {number} Score de compatibilidad (0-20)
 */
const calculateSoilCompatibilityScore = (tractor, terrainAnalysis) => {
  const maxScore = SCORING_CONFIG.WEIGHTS.SOIL;
  const preferredTire = terrainAnalysis.classification.preferredTire;
  const soilDifficulty = terrainAnalysis.metrics.soilDifficulty;
  const tractionType = normalizeTractionType(tractor.traction_type);
  const tireType = (tractor.tire_type || '').toLowerCase();
  
  let score = maxScore / 2; // Base: 10 pts
  
  // Bonus si tiene el tipo de neumático preferido
  if (preferredTire === 'track' && tractionType === 'track') {
    score = maxScore; // Máximo para orugas en suelo difícil
  } else if (preferredTire === 'reinforced' && tireType.includes('reforzad')) {
    score = maxScore * 0.9;
  } else if (preferredTire === 'standard' && tractionType !== 'track') {
    score = maxScore * 0.8;
  }
  
  // Ajuste por dificultad del suelo
  // Suelos difíciles sin equipo adecuado = penalización
  if (soilDifficulty > 70 && tractionType !== 'track') {
    score *= 0.7;
  }
  
  return Math.round(score * 100) / 100;
};

/**
 * Calcula el score económico (0-15 pts)
 * 
 * @description
 * Prefiere tractores de menor consumo/cilindraje capaces.
 * Si no hay datos de consumo, usa la potencia como proxy inverso.
 * 
 * @param {Object} tractor - Datos del tractor
 * @param {number} requiredPower - Potencia mínima requerida
 * @param {Object} [context] - Contexto con lista completa para normalización
 * @returns {number} Score económico (0-15)
 */
const calculateEconomicScore = (tractor, requiredPower, context = {}) => {
  const maxScore = SCORING_CONFIG.WEIGHTS.ECONOMIC;
  const tractorPower = tractor.engine_power_hp || tractor.enginePowerHp || 0;
  
  // Si hay dato de consumo, usarlo directamente
  if (tractor.fuel_consumption_lph) {
    // Normalizar: menor consumo = mayor score
    // Asumiendo consumo típico entre 5 y 25 L/h
    const consumptionNormalized = 1 - ((tractor.fuel_consumption_lph - 5) / 20);
    return Math.max(0, Math.min(maxScore, consumptionNormalized * maxScore));
  }
  
  // Sin dato de consumo: usar potencia como proxy
  // Menor potencia (pero suficiente) = más económico
  const powerRatio = requiredPower / tractorPower; // 0.7 a 1.0 típicamente
  const economyScore = powerRatio * maxScore;
  
  return Math.max(0, Math.min(maxScore, economyScore));
};

/**
 * Calcula el score de disponibilidad (0-10 pts)
 * 
 * @description
 * Evalúa la disponibilidad del tractor.
 * Por ahora hardcodeado a 100% si está disponible.
 * 
 * @param {Object} tractor - Datos del tractor
 * @returns {number} Score de disponibilidad (0-10)
 */
const calculateAvailabilityScore = (tractor) => {
  const maxScore = SCORING_CONFIG.WEIGHTS.AVAILABILITY;
  const status = (tractor.status || 'available').toLowerCase();
  
  switch (status) {
    case 'available':
    case 'active':
      return maxScore;
    case 'in_use':
    case 'maintenance':
      return maxScore * 0.5;
    case 'unavailable':
    case 'inactive':
      return 0;
    default:
      return maxScore; // Asumir disponible por defecto
  }
};

/**
 * Calcula el score total de un tractor (0-100 pts)
 * 
 * @description
 * Algoritmo de scoring ponderado determinista:
 * - Eficiencia (30%): Penalizar sobredimensionamiento
 * - Tracción (25%): Bonus por 4WD en pendientes
 * - Suelo (20%): Compatibilidad de rodadura
 * - Económico (15%): Preferir menor consumo
 * - Disponibilidad (10%): Estado del tractor
 * 
 * @param {Object} tractor - Datos del tractor
 * @param {Object} implement - Datos del implemento
 * @param {Object} terrain - Datos del terreno
 * @param {number} requiredPower - Potencia mínima calculada
 * @returns {Object} Desglose de scores y total
 * 
 * @example
 * const score = calculateScore(tractor, implement, terrain, 85);
 * / { total: 78.5, breakdown: { efficiency: 25, traction: 20, ... } }
 */
export const calculateScore = (tractor, implement, terrain, requiredPower) => {
  const terrainAnalysis = analyzeTerrain(terrain);
  const tractorPower = tractor.engine_power_hp || tractor.enginePowerHp || 0;
  
  // Calcular cada componente del score
  const efficiencyScore = calculateEfficiencyScore(tractorPower, requiredPower);
  const tractionScore = calculateTractionScore(tractor, terrainAnalysis);
  const soilScore = calculateSoilCompatibilityScore(tractor, terrainAnalysis);
  const economicScore = calculateEconomicScore(tractor, requiredPower);
  const availabilityScore = calculateAvailabilityScore(tractor);
  
  // Score total
  const totalScore = efficiencyScore + tractionScore + soilScore + economicScore + availabilityScore;
  
  return {
    total: Math.round(totalScore * 100) / 100,
    breakdown: {
      efficiency: Math.round(efficiencyScore * 100) / 100,
      traction: Math.round(tractionScore * 100) / 100,
      soil: Math.round(soilScore * 100) / 100,
      economic: Math.round(economicScore * 100) / 100,
      availability: Math.round(availabilityScore * 100) / 100,
    },
    maxPossible: 100,
    percentageScore: Math.round((totalScore / 100) * 10000) / 100,
  };
};


// FUNCIÓN PRINCIPAL DE RECOMENDACIÓN

/**
 * Genera recomendaciones de tractores ordenadas por score
 * 
 * @description
 * Orquesta el proceso completo de recomendación:
 * 1. Analizar terreno
 * 2. Filtrar tractores compatibles
 * 3. Calcular score de cada tractor
 * 4. Ordenar y retornar top N
 * 
 * @param {Object} params - Parámetros de entrada
 * @param {Object} params.terrain - Datos del terreno
 * @param {Object} params.implement - Datos del implemento
 * @param {Array<Object>} params.tractors - Lista de tractores disponibles
 * @param {number} params.requiredPower - Potencia mínima requerida (HP)
 * @param {Object} [params.options] - Opciones adicionales
 * @param {number} [params.options.limit=5] - Máximo de recomendaciones
 * @param {boolean} [params.options.includeUnavailable=false] - Incluir no disponibles
 * @returns {Object} Resultado con recomendaciones y metadatos
 * 
 * @example
 * const result = generateRecommendation({
 *   terrain: { slope_percentage: 12, soil_type: 'clay' },
 *   implement: { power_requirement_hp: 50, working_depth_m: 0.3 },
 *   tractors: tractorsList,
 *   requiredPower: 85
 * });
 * 
 * console.log(result.recommendations[0]); // Mejor tractor
 * console.log(result.summary.topScore); // Score del mejor
 */
export const generateRecommendation = (params) => {
  const { terrain, implement, tractors, requiredPower, options = {} } = params;
  
  // Validaciones
  if (!terrain) {
    throw new Error('terrain es requerido');
  }
  if (!Array.isArray(tractors)) {
    throw new Error('tractors debe ser un array');
  }
  if (typeof requiredPower !== 'number' || requiredPower <= 0) {
    throw new Error('requiredPower debe ser un número positivo');
  }
  
  const { limit = SCORING_CONFIG.TOP_RECOMMENDATIONS, includeUnavailable = false } = options;
  
  // Paso 1: Analizar terreno
  const terrainAnalysis = analyzeTerrain(terrain);
  
  // Paso 2: Filtrar tractores compatibles
  const compatibleTractors = findCompatibleTractors(
    terrain, 
    tractors, 
    requiredPower, 
    { includeUnavailable }
  );
  
  // Caso: No hay tractores compatibles
  if (compatibleTractors.length === 0) {
    return {
      success: false,
      recommendations: [],
      terrainAnalysis,
      summary: {
        totalEvaluated: tractors.length,
        compatibleCount: 0,
        filteredOut: tractors.length,
        reason: terrainAnalysis.requirements.requires4WD 
          ? 'No hay tractores 4WD con potencia suficiente para pendiente > 15%'
          : 'No hay tractores con potencia suficiente',
      },
    };
  }
  
  // Paso 3: Calcular score de cada tractor
  const scoredTractors = compatibleTractors.map((tractor) => {
    const score = calculateScore(tractor, implement, terrain, requiredPower);
    const tractorPower = tractor.engine_power_hp || tractor.enginePowerHp || 0;
    
    return {
      tractor,
      score,
      compatibility: {
        requiredPower: Math.round(requiredPower * 100) / 100,
        tractorPower,
        surplusHP: Math.round((tractorPower - requiredPower) * 100) / 100,
        utilizationPercent: Math.round((requiredPower / tractorPower) * 10000) / 100,
      },
    };
  });
  
  // Paso 4: Ordenar por score (mayor primero)
  scoredTractors.sort((a, b) => b.score.total - a.score.total);
  
  // Paso 5: Tomar top N y agregar ranking
  const recommendations = scoredTractors
    .slice(0, limit)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      classification: classifyTractorFit(item.compatibility.utilizationPercent),
    }));
  
  return {
    success: true,
    recommendations,
    terrainAnalysis,
    summary: {
      totalEvaluated: tractors.length,
      compatibleCount: compatibleTractors.length,
      filteredOut: tractors.length - compatibleTractors.length,
      topScore: recommendations[0]?.score.total || 0,
      topTractor: recommendations[0]?.tractor || null,
    },
  };
};

/**
 * Clasifica el ajuste del tractor según utilización
 * 
 * @param {number} utilizationPercent - Porcentaje de utilización de potencia
 * @returns {Object} Clasificación con label y descripción
 */
const classifyTractorFit = (utilizationPercent) => {
  if (utilizationPercent >= 85) {
    return { label: 'OPTIMAL', description: 'Ajuste óptimo', emoji: '✅' };
  }
  if (utilizationPercent >= 70) {
    return { label: 'GOOD', description: 'Buen ajuste', emoji: '👍' };
  }
  if (utilizationPercent >= 50) {
    return { label: 'OVERPOWERED', description: 'Sobredimensionado', emoji: '⚠️' };
  }
  return { label: 'EXCESSIVE', description: 'Excesivamente sobredimensionado', emoji: '❌' };
};



// EXPORTACIONES


export { 
  SCORING_CONFIG, 
  SLOPE_CLASSIFICATION, 
  SOIL_DIFFICULTY,
  normalizeSoilType,
  normalizeTractionType,
  classifySlope,
  classifyTractorFit,
};

export default {
  analyzeTerrain,
  findCompatibleTractors,
  calculateScore,
  generateRecommendation,
  SCORING_CONFIG,
  SLOPE_CLASSIFICATION,
  SOIL_DIFFICULTY,
};
