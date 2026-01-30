/**
 * @overview Servicio de cálculo de potencia mínima requerida para implementos agrícolas
 * @module services/minimumPowerService
 * 
 * @description
 * Implementa el cálculo de potencia mínima según Checklist:
 * ```
 * HP_min = HP_base × F_suelo × F_pendiente × F_profundidad × 1.15
 * ```
 * 
 * @example
 * import { calculateMinimumPower, findCompatibleTractors } from './minimumPowerService.js';
 * 
 * const power = calculateMinimumPower(
 *   { power_requirement_hp: 80, working_depth_m: 0.30 },
 *   { soil_type: 'clay', slope_percentage: 10 }
 * );
 * 
 * const tractors = findCompatibleTractors(power.minimumPowerHP, tractorsList);
 */


// CONSTANTES

/**
 * Constantes para cálculo de potencia mínima
 * @constant {Object}
 */
const CONSTANTS = {
  /** Margen de seguridad del 15% */
  SAFETY_MARGIN: 0.15,
  
  /** Profundidad estándar de referencia en metros (25 cm) */
  STANDARD_DEPTH_M: 0.25,
  
  /** Factores de resistencia por tipo de suelo */
  SOIL_FACTORS: {
    clay: 1.3,
    loam: 1.0,
    sandy: 0.8,
    rocky: 1.5,
  },
  
  /** Número máximo de tractores a retornar */
  TOP_TRACTORS_LIMIT: 5,
};


// FUNCIONES AUXILIARES


/**
 * Normaliza el tipo de suelo a un valor reconocido por el sistema
 * 
 * @param {string|null|undefined} soilType - Tipo de suelo
 * @returns {string} Tipo de suelo normalizado (clay|loam|sandy|rocky)
 * 
 * @example
 * normalizeSoilType('Arcilla');  // -> 'clay'
 * normalizeSoilType('SANDY');    // -> 'sandy'
 * normalizeSoilType(null);       // -> 'loam' (default)
 */
const normalizeSoilType = (soilType) => {
  if (!soilType) return 'loam';
  
  const normalized = soilType.toLowerCase().trim();
  
  const soilMapping = {
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
  };
  
  return soilMapping[normalized] || 'loam';
};

// FUNCIONES PRINCIPALES

/**
 * Calcula la potencia mínima requerida para un implemento agrícola
 * 
 * @description
 * Fórmula:
 * ```
 * HP_min = HP_base × F_suelo × F_pendiente × F_profundidad × 1.15
 * ```
 * 
 * Donde:
 * - F_suelo: clay=1.3, loam=1.0, sandy=0.8, rocky=1.5
 * - F_pendiente: 1 + (pendiente / 100) * 0.5
 * - F_profundidad: working_depth_m / 0.25
 * - 1.15: Margen de seguridad (+15%)
 * 
 * @param {Object} implementData - Datos del implemento
 * @param {number} implementData.power_requirement_hp - Potencia base requerida (HP)
 * @param {number} [implementData.working_depth_m=0.25] - Profundidad de trabajo (m)
 * @param {Object} terrainData - Datos del terreno
 * @param {string} terrainData.soil_type - Tipo de suelo
 * @param {number} terrainData.slope_percentage - Pendiente del terreno (%)
 * @returns {Object} Resultado del cálculo
 * 
 * @throws {Error} Si power_requirement_hp no es un número
 * @throws {Error} Si slope_percentage no es un número
 * 
 * @example
 * const result = calculateMinimumPower(
 *   { power_requirement_hp: 80, working_depth_m: 0.30 },
 *   { soil_type: 'clay', slope_percentage: 10 }
 * );
 * console.log(result.minimumPowerHP); // ~150.70 HP
 */
export const calculateMinimumPower = (implementData, terrainData) => {
  // Validar datos de entrada
  if (!implementData || typeof implementData.power_requirement_hp !== 'number') {
    throw new Error('implementData.power_requirement_hp es requerido y debe ser un número');
  }
  
  if (!terrainData || typeof terrainData.slope_percentage !== 'number') {
    throw new Error('terrainData.slope_percentage es requerido y debe ser un número');
  }
  
  // Extraer valores
  const basePower = implementData.power_requirement_hp;
  const workingDepthM = implementData.working_depth_m || CONSTANTS.STANDARD_DEPTH_M;
  const soilType = normalizeSoilType(terrainData.soil_type);
  const slopePercent = terrainData.slope_percentage;
  
  // Factor de suelo: clay=1.3, loam=1.0, sandy=0.8, rocky=1.5
  const soilFactor = CONSTANTS.SOIL_FACTORS[soilType] || CONSTANTS.SOIL_FACTORS.loam;
  
  // Factor de pendiente: 1 + (pendiente / 100) * 0.5
  const slopeFactor = 1 + (slopePercent / 100) * 0.5;
  
  // Factor de profundidad: working_depth_m / profundidad_estándar
  const depthFactor = workingDepthM / CONSTANTS.STANDARD_DEPTH_M;
  
  // Potencia calculada (sin margen)
  const calculatedPower = basePower * soilFactor * slopeFactor * depthFactor;
  
  // Aplicar margen de seguridad del 15%
  const minimumPowerHP = calculatedPower * (1 + CONSTANTS.SAFETY_MARGIN);
  
  return {
    minimumPowerHP: Math.round(minimumPowerHP * 100) / 100,
    calculatedPowerHP: Math.round(calculatedPower * 100) / 100,
    factors: {
      basePowerHP: basePower,
      soilFactor: Math.round(soilFactor * 1000) / 1000,
      slopeFactor: Math.round(slopeFactor * 1000) / 1000,
      depthFactor: Math.round(depthFactor * 1000) / 1000,
      safetyMargin: CONSTANTS.SAFETY_MARGIN,
    },
    input: {
      implementData: { power_requirement_hp: basePower, working_depth_m: workingDepthM },
      terrainData: { soil_type: soilType, slope_percentage: slopePercent },
    },
  };
};

/**
 * Encuentra tractores compatibles y retorna el top 5 más eficientes
 * 
 * @description
 * - Filtra tractores con potencia >= minimumPower
 * - Ordena por eficiencia (menor exceso de potencia = más eficiente)
 * - Retorna máximo 5 tractores
 * 
 * @param {number} minimumPower - Potencia mínima requerida (HP)
 * @param {Array<Object>} tractorsList - Lista de tractores disponibles
 * @returns {Array<Object>} Top 5 tractores ordenados por eficiencia
 * 
 * @throws {Error} Si minimumPower no es un número positivo
 * 
 * @example
 * const tractors = findCompatibleTractors(100, tractorsList);
 * console.log(tractors[0].compatibility.rank); // 1
 */
export const findCompatibleTractors = (minimumPower, tractorsList) => {
  if (!Array.isArray(tractorsList) || tractorsList.length === 0) {
    return [];
  }
  
  if (typeof minimumPower !== 'number' || minimumPower <= 0) {
    throw new Error('minimumPower debe ser un número positivo');
  }
  
  // Filtrar tractores con potencia suficiente
  const compatibleTractors = tractorsList
    .filter((tractor) => {
      const tractorHP = tractor.engine_power_hp || tractor.enginePowerHp || 0;
      return tractorHP >= minimumPower;
    })
    .map((tractor) => {
      const tractorHP = tractor.engine_power_hp || tractor.enginePowerHp || 0;
      const surplus = tractorHP - minimumPower;
      const efficiencyRatio = minimumPower / tractorHP;
      
      return {
        ...tractor,
        compatibility: {
          minimumPowerRequired: Math.round(minimumPower * 100) / 100,
          tractorPowerHP: tractorHP,
          surplusHP: Math.round(surplus * 100) / 100,
          efficiencyPercent: Math.round(efficiencyRatio * 10000) / 100,
        },
      };
    });
  
  // Ordenar por eficiencia (menor surplus = más eficiente)
  compatibleTractors.sort((a, b) => a.compatibility.surplusHP - b.compatibility.surplusHP);
  
  // Retornar top 5 con ranking
  return compatibleTractors
    .slice(0, CONSTANTS.TOP_TRACTORS_LIMIT)
    .map((tractor, index) => ({
      ...tractor,
      compatibility: { ...tractor.compatibility, rank: index + 1 },
    }));
};

/**
 * Calcula potencia mínima y encuentra tractores compatibles en una sola llamada
 * 
 * @param {Object} implementData - Datos del implemento
 * @param {Object} terrainData - Datos del terreno
 * @param {Array<Object>} tractorsList - Lista de tractores
 * @returns {Object} Resultado con powerRequirement y compatibleTractors
 * 
 * @example
 * const result = calculateAndMatch(implementData, terrainData, tractorsList);
 * console.log(result.powerRequirement.minimumPowerHP);
 * console.log(result.compatibleTractors[0]);
 */
export const calculateAndMatch = (implementData, terrainData, tractorsList) => {
  const powerResult = calculateMinimumPower(implementData, terrainData);
  const compatibleTractors = findCompatibleTractors(powerResult.minimumPowerHP, tractorsList);
  
  return {
    powerRequirement: powerResult,
    compatibleTractors,
    summary: {
      minimumPowerHP: powerResult.minimumPowerHP,
      totalTractorsEvaluated: tractorsList.length,
      compatibleCount: compatibleTractors.length,
      topRecommendation: compatibleTractors[0] || null,
    },
  };
};


// EXPORTACIONES


export { CONSTANTS, normalizeSoilType };

export default {
  calculateMinimumPower,
  findCompatibleTractors,
  calculateAndMatch,
  CONSTANTS,
  normalizeSoilType,
};
