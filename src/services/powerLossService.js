/**
 * @overview Servicio de cálculo de pérdidas de potencia en tractores
 * @module services/powerLossService
 */

// CONSTANTES FÍSICAS (Paper & Tesis)

const CONSTANTS = {
  /** Divisor de conversión métrica a HP (kgf*m/s -> HP) */
  HP_CONVERSION_FACTOR: 274.4,
  
  /** Temperatura base de referencia en °C */
  BASE_TEMPERATURE_C: 15,
  
  /** Pérdida porcentual por cada 5°C sobre temperatura base */
  TEMP_LOSS_PER_5C: 1,
  
  /** Altitud de referencia (nivel del mar) en metros */
  BASE_ALTITUDE_M: 0,
  
  /** Pérdida porcentual por cada 300m sobre nivel del mar */
  ALTITUDE_LOSS_PER_300M: 1,
  
  /** Factor de pérdida por transmisión mecánica (default 13%) */
  DEFAULT_TRANSMISSION_LOSS: 0.13,
  
  /** Gravedad estándar (implícita en kgf) */
  GRAVITY_KGF: 1, // 1 kgf = 1 kg * g
};

// FUNCIONES AUXILIARES DE CONVERSIÓN

/**
 * Convierte grados a radianes
 * @param {number} degrees - Ángulo en grados
 * @returns {number} Ángulo en radianes
 */
export const degreesToRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Convierte radianes a grados
 * @param {number} radians - Ángulo en radianes
 * @returns {number} Ángulo en grados
 */
export const radiansToDegrees = (radians) => {
  return radians * (180 / Math.PI);
};

/**
 * Convierte porcentaje de pendiente a grados
 * @param {number} slopePercent - Pendiente en porcentaje (ej: 10 para 10%)
 * @returns {number} Ángulo en grados
 */
export const slopePercentToDegrees = (slopePercent) => {
  return radiansToDegrees(Math.atan(slopePercent / 100));
};

/**
 * Convierte grados a porcentaje de pendiente
 * @param {number} degrees - Ángulo en grados
 * @returns {number} Pendiente en porcentaje
 */
export const degreesToSlopePercent = (degrees) => {
  return Math.tan(degreesToRadians(degrees)) * 100;
};

/**
 * Convierte velocidad de km/h a m/s
 * @param {number} speedKmh - Velocidad en km/h
 * @returns {number} Velocidad en m/s
 */
export const kmhToMs = (speedKmh) => {
  return speedKmh / 3.6;
};

// FUNCIONES DE CÁLCULO DE PÉRDIDAS

/**
 * Calcula la pérdida de potencia por altitud
 * Descuenta 1% por cada 300m sobre el nivel del mar
 * Solo aplica para tractores aspirados (sin turbo).
 * Tractores turboalimentados compensan la pérdida de densidad del aire.
 *
 * @param {number} enginePower - Potencia del motor en HP
 * @param {number} altitudeMeters - Altitud sobre nivel del mar en metros
 * @param {boolean} hasTurbo - Si el tractor tiene turbocompresor
 * @returns {number} Potencia perdida por altitud en HP
 *
 * @example
 * // A 1500m de altitud con motor de 100 HP (aspirado)
 * calculateAltitudeLoss(100, 1500, false) // -> 5 HP (5% de pérdida)
 * // Con turbo: sin pérdida
 * calculateAltitudeLoss(100, 1500, true) // -> 0 HP
 */
export const calculateAltitudeLoss = (enginePower, altitudeMeters, hasTurbo = false) => {
  // Tractores turboalimentados compensan la pérdida de densidad del aire
  if (hasTurbo) {
    return 0;
  }

  if (altitudeMeters <= CONSTANTS.BASE_ALTITUDE_M) {
    return 0;
  }

  const lossPercent = (altitudeMeters / 300) * CONSTANTS.ALTITUDE_LOSS_PER_300M;
  return enginePower * (lossPercent / 100);
};

/**
 * Calcula la pérdida de potencia por temperatura
 * Descuenta 1% por cada 5°C sobre 15°C
 * Solo aplica para tractores aspirados (sin turbo).
 * Tractores turboalimentados compensan la menor densidad del aire caliente.
 *
 * @param {number} enginePower - Potencia del motor en HP
 * @param {number} temperatureC - Temperatura ambiente en °C
 * @param {boolean} hasTurbo - Si el tractor tiene turbocompresor
 * @returns {number} Potencia perdida por temperatura en HP
 *
 * @example
 * // A 35°C con motor de 100 HP (aspirado)
 * calculateTemperatureLoss(100, 35, false) // -> 4 HP (4% de pérdida por 20°C sobre base)
 * // Con turbo: sin pérdida
 * calculateTemperatureLoss(100, 35, true) // -> 0 HP
 */
export const calculateTemperatureLoss = (enginePower, temperatureC, hasTurbo = false) => {
  // Tractores turboalimentados compensan la menor densidad del aire caliente
  if (hasTurbo) {
    return 0;
  }

  if (temperatureC <= CONSTANTS.BASE_TEMPERATURE_C) {
    return 0;
  }

  const tempDiff = temperatureC - CONSTANTS.BASE_TEMPERATURE_C;
  const lossPercent = (tempDiff / 5) * CONSTANTS.TEMP_LOSS_PER_5C;
  return enginePower * (lossPercent / 100);
};

/**
 * Calcula la pérdida de potencia por transmisión mecánica
 * Aplica un factor de pérdida mecánica (default 13%)
 * 
 * @param {number} netEnginePower - Potencia neta del motor en HP
 * @param {number} [transmissionLossFactor=0.13] - Factor de pérdida (0-1)
 * @returns {number} Potencia perdida por transmisión en HP
 * 
 * @example
 * calculateTransmissionLoss(100) // -> 13 HP con factor default
 * calculateTransmissionLoss(100, 0.15) // -> 15 HP con factor custom
 */
export const calculateTransmissionLoss = (
  netEnginePower,
  transmissionLossFactor = CONSTANTS.DEFAULT_TRANSMISSION_LOSS
) => {
  return netEnginePower * transmissionLossFactor;
};

/**
 * Calcula el coeficiente de rodadura del suelo
 * Basado en el número de cono del suelo (Cn)
 * 
 * @param {number} soilCn - Número de cono del suelo (índice de penetración)
 * @returns {number} Coeficiente de rodadura (adimensional)
 */
export const calculateRollingCoefficient = (soilCn) => {
  // Fórmula empírica: μr = 1.2/Cn + 0.04
  // Para suelos más blandos (Cn bajo), mayor resistencia
  return (1.2 / soilCn) + 0.04;
};

/**
 * Calcula la pérdida de potencia por resistencia a la rodadura
 * Incluye componente del coseno del ángulo para mayor precisión
 * 
 * @param {number} totalWeightKg - Peso total del tractor en kg
 * @param {number} soilCn - Número de cono del suelo (índice de penetración)
 * @param {number} slopePercent - Pendiente del terreno en porcentaje
 * @param {number} speedKmh - Velocidad de desplazamiento en km/h
 * @returns {number} Potencia perdida por rodadura en HP
 * 
 * @example
 * // Tractor de 5000kg en suelo con Cn=50, pendiente 10%, a 8 km/h
 * calculateRollingResistanceHP(5000, 50, 10, 8)
 */
export const calculateRollingResistanceHP = (
  totalWeightKg,
  soilCn,
  slopePercent,
  speedKmh
) => {
  // Calcular ángulo de pendiente
  const slopeDegrees = slopePercentToDegrees(slopePercent);
  const slopeRadians = degreesToRadians(slopeDegrees);
  
  // Calcular coeficiente de rodadura
  const rollingCoef = calculateRollingCoefficient(soilCn);
  
  // Fuerza normal = W * cos(θ) [en kgf ya que W está en kg y g=1 kgf/kg]
  const normalForce = totalWeightKg * Math.cos(slopeRadians);
  
  // Fuerza de resistencia a la rodadura = μr * Fn
  const rollingResistanceForce = rollingCoef * normalForce;
  
  // Velocidad en m/s
  const speedMs = kmhToMs(speedKmh);
  
  // Potencia = Fuerza * Velocidad (kgf*m/s)
  const powerKgfMs = rollingResistanceForce * speedMs;
  
  // Convertir a HP usando el factor 274.4
  return powerKgfMs / CONSTANTS.HP_CONVERSION_FACTOR;
};

/**
 * Calcula la pérdida de potencia por pendiente (componente gravitacional)
 * Calcula la fuerza componente del peso W*sin(θ)
 * 
 * @param {number} totalWeightKg - Peso total del tractor en kg
 * @param {number} slopePercent - Pendiente del terreno en porcentaje
 * @param {number} speedKmh - Velocidad de desplazamiento en km/h
 * @returns {number} Potencia perdida por pendiente en HP
 * 
 * @example
 * / Tractor de 5000kg en pendiente 15% a 6 km/h
 * calculateSlopeLossHP(5000, 15, 6)
 */
export const calculateSlopeLossHP = (totalWeightKg, slopePercent, speedKmh) => {
  // Si la pendiente es 0 o negativa (bajada), no hay pérdida
  if (slopePercent <= 0) {
    return 0;
  }
  
  // Calcular ángulo de pendiente
  const slopeDegrees = slopePercentToDegrees(slopePercent);
  const slopeRadians = degreesToRadians(slopeDegrees);
  
  // Fuerza componente gravitacional = W * sin(θ) [en kgf]
  const slopeForce = totalWeightKg * Math.sin(slopeRadians);
  
  // Velocidad en m/s
  const speedMs = kmhToMs(speedKmh);
  
  // Potencia = Fuerza * Velocidad (kgf*m/s)
  const powerKgfMs = slopeForce * speedMs;
  
  // Convertir a HP usando el factor 274.4
  return powerKgfMs / CONSTANTS.HP_CONVERSION_FACTOR;
};

/**
 * Calcula la potencia "desperdiciada" por patinaje de las ruedas
 * 
 * @param {number} powerAvailable - Potencia disponible en HP
 * @param {number} slippagePercent - Porcentaje de patinaje (0-100)
 * @returns {number} Potencia perdida por patinaje en HP
 * 
 * @example
 * / Con 80 HP disponibles y 15% de patinaje
 * calculateSlippageLossHP(80, 15) // -> 12 HP perdidos
 */
export const calculateSlippageLossHP = (powerAvailable, slippagePercent) => {
  if (slippagePercent <= 0) {
    return 0;
  }
  
  return powerAvailable * (slippagePercent / 100);
};

// FUNCIÓN ORQUESTADORA PRINCIPAL

/**
 * Calcula todas las pérdidas de potencia y retorna el desglose completo
 *
 * @param {Object} params - Parámetros de entrada
 * @param {number} params.enginePower - Potencia nominal del motor en HP
 * @param {number} params.altitudeMeters - Altitud sobre nivel del mar en metros
 * @param {number} params.temperatureC - Temperatura ambiente en °C
 * @param {number} params.totalWeightKg - Peso total del tractor en kg
 * @param {number} params.soilCn - Número de cono del suelo
 * @param {number} params.slopePercent - Pendiente del terreno en porcentaje
 * @param {number} params.speedKmh - Velocidad de desplazamiento en km/h
 * @param {number} params.slippagePercent - Porcentaje de patinaje
 * @param {number} [params.transmissionLossFactor=0.13] - Factor de pérdida de transmisión
 * @param {boolean} [params.hasTurbo=false] - Si el tractor tiene turbocompresor
 *
 * @returns {Object} Objeto con desglose de pérdidas y potencia neta final
 * @returns {number} returns.grossPower - Potencia bruta del motor (HP)
 * @returns {Object} returns.losses - Desglose de pérdidas
 * @returns {number} returns.losses.altitude - Pérdida por altitud (HP)
 * @returns {number} returns.losses.temperature - Pérdida por temperatura (HP)
 * @returns {number} returns.losses.transmission - Pérdida por transmisión (HP)
 * @returns {number} returns.losses.rollingResistance - Pérdida por rodadura (HP)
 * @returns {number} returns.losses.slope - Pérdida por pendiente (HP)
 * @returns {number} returns.losses.slippage - Pérdida por patinaje (HP)
 * @returns {number} returns.losses.total - Total de pérdidas (HP)
 * @returns {number} returns.netPower - Potencia neta disponible para trabajo (HP)
 * @returns {number} returns.efficiency - Eficiencia total (%)
 * @returns {boolean} returns.hasTurbo - Si el tractor tiene turbo
 *
 * @example
 * const result = calculateTotalLoss({
 *   enginePower: 120,
 *   altitudeMeters: 2000,
 *   temperatureC: 30,
 *   totalWeightKg: 6000,
 *   soilCn: 45,
 *   slopePercent: 12,
 *   speedKmh: 7,
 *   slippagePercent: 10,
 *   hasTurbo: false  // Tractor aspirado: pérdidas atmosféricas SÍ aplican
 * });
 */
export const calculateTotalLoss = ({
  enginePower,
  altitudeMeters,
  temperatureC,
  totalWeightKg,
  soilCn,
  slopePercent,
  speedKmh,
  slippagePercent,
  transmissionLossFactor = CONSTANTS.DEFAULT_TRANSMISSION_LOSS,
  hasTurbo = false,
}) => {
  // 1. Pérdidas atmosféricas (solo para tractores aspirados — sin turbo)
  // Según Chaparro: altitud y temperatura "solo para tractores aspirados"
  const altitudeLoss = calculateAltitudeLoss(enginePower, altitudeMeters, hasTurbo);
  const temperatureLoss = calculateTemperatureLoss(enginePower, temperatureC, hasTurbo);
  
  // Potencia después de pérdidas atmosféricas
  const powerAfterAtmospheric = enginePower - altitudeLoss - temperatureLoss;
  
  // 2. Pérdida por transmisión (sobre potencia ajustada)
  const transmissionLoss = calculateTransmissionLoss(
    powerAfterAtmospheric,
    transmissionLossFactor
  );
  
  // Potencia en el eje de las ruedas
  const powerAtWheels = powerAfterAtmospheric - transmissionLoss;
  
  // 3. Pérdidas mecánicas del terreno
  const rollingResistanceLoss = calculateRollingResistanceHP(
    totalWeightKg,
    soilCn,
    slopePercent,
    speedKmh
  );
  
  const slopeLoss = calculateSlopeLossHP(totalWeightKg, slopePercent, speedKmh);
  
  // Potencia disponible antes de patinaje
  const powerBeforeSlippage = powerAtWheels - rollingResistanceLoss - slopeLoss;
  
  // 4. Pérdida por patinaje
  const slippageLoss = calculateSlippageLossHP(
    Math.max(0, powerBeforeSlippage),
    slippagePercent
  );
  
  // Potencia neta final
  const netPower = Math.max(0, powerBeforeSlippage - slippageLoss);
  
  // Total de pérdidas
  const totalLosses =
    altitudeLoss +
    temperatureLoss +
    transmissionLoss +
    rollingResistanceLoss +
    slopeLoss +
    slippageLoss;
  
  // Eficiencia
  const efficiency = (netPower / enginePower) * 100;
  
  return {
    grossPower: enginePower,
    hasTurbo,
    losses: {
      altitude: parseFloat(altitudeLoss.toFixed(2)),
      temperature: parseFloat(temperatureLoss.toFixed(2)),
      transmission: parseFloat(transmissionLoss.toFixed(2)),
      rollingResistance: parseFloat(rollingResistanceLoss.toFixed(2)),
      slope: parseFloat(slopeLoss.toFixed(2)),
      slippage: parseFloat(slippageLoss.toFixed(2)),
      total: parseFloat(totalLosses.toFixed(2)),
    },
    netPower: parseFloat(netPower.toFixed(2)),
    efficiency: parseFloat(efficiency.toFixed(2)),
  };
};

// EXPORTACIÓN DE CONSTANTES (para testing/debugging)

export const getConstants = () => ({ ...CONSTANTS });
