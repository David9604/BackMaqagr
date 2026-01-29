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
 * 
 * @param {number} enginePower - Potencia del motor en HP
 * @param {number} altitudeMeters - Altitud sobre nivel del mar en metros
 * @returns {number} Potencia perdida por altitud en HP
 * 
 * @example
 * / A 1500m de altitud con motor de 100 HP
 * calculateAltitudeLoss(100, 1500) // -> 5 HP (5% de pérdida)
 */
export const calculateAltitudeLoss = (enginePower, altitudeMeters) => {
  if (altitudeMeters <= CONSTANTS.BASE_ALTITUDE_M) {
    return 0;
  }
  
  const lossPercent = (altitudeMeters / 300) * CONSTANTS.ALTITUDE_LOSS_PER_300M;
  return enginePower * (lossPercent / 100);
};

/**
 * Calcula la pérdida de potencia por temperatura
 * Descuenta 1% por cada 5°C sobre 15°C
 * 
 * @param {number} enginePower - Potencia del motor en HP
 * @param {number} temperatureC - Temperatura ambiente en °C
 * @returns {number} Potencia perdida por temperatura en HP
 * 
 * @example
 * / A 35°C con motor de 100 HP
 * calculateTemperatureLoss(100, 35) // -> 4 HP (4% de pérdida por 20°C sobre base)
 */
export const calculateTemperatureLoss = (enginePower, temperatureC) => {
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
 *   slippagePercent: 10
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
}) => {
  // 1. Pérdidas atmosféricas (sobre potencia bruta)
  const altitudeLoss = calculateAltitudeLoss(enginePower, altitudeMeters);
  const temperatureLoss = calculateTemperatureLoss(enginePower, temperatureC);
  
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

// PRUEBAS UNITARIAS (Ejecutar con: node --experimental-vm-modules src/services/powerLossService.js)

/**
 * Ejecuta los tests unitarios básicos
 * Para ejecutar: node src/services/powerLossService.js
 */
const runTests = () => {
  console.log('[PRUEBAS] Ejecutando Unit Tests para powerLossService...\n');
  
  let passed = 0;
  let failed = 0;
  
  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  [OK] ${testName}`);
      passed++;
    } else {
      console.log(`  [FALLO] ${testName}`);
      failed++;
    }
  };
  
  const approxEqual = (a, b, tolerance = 0.01) => Math.abs(a - b) < tolerance;
  
  // Test 1: Pérdida por altitud
  console.log('\n[ALTITUD] Test: calculateAltitudeLoss');
  const altLoss = calculateAltitudeLoss(100, 1500);
  assert(approxEqual(altLoss, 5), 'A 1500m, 100HP pierde 5HP (5%)');
  assert(calculateAltitudeLoss(100, 0) === 0, 'A nivel del mar no hay pérdida');
  assert(calculateAltitudeLoss(100, -100) === 0, 'Altitud negativa retorna 0');
  
  // Test 2: Pérdida por temperatura
  console.log('\n[TEMPERATURA] Test: calculateTemperatureLoss');
  const tempLoss = calculateTemperatureLoss(100, 35);
  assert(approxEqual(tempLoss, 4), 'A 35°C, 100HP pierde 4HP (20°C sobre base)');
  assert(calculateTemperatureLoss(100, 15) === 0, 'A 15°C no hay pérdida');
  assert(calculateTemperatureLoss(100, 10) === 0, 'Bajo 15°C no hay pérdida');
  
  // Test 3: Pérdida por transmisión
  console.log('\n[TRANSMISION] Test: calculateTransmissionLoss');
  const transLoss = calculateTransmissionLoss(100);
  assert(approxEqual(transLoss, 13), 'Con factor default 0.13, pierde 13HP');
  assert(approxEqual(calculateTransmissionLoss(100, 0.15), 15), 'Con factor 0.15, pierde 15HP');
  
  // Test 4: Coeficiente de rodadura
  console.log('\n[RODADURA] Test: calculateRollingCoefficient');
  const rollCoef = calculateRollingCoefficient(50);
  assert(approxEqual(rollCoef, 0.064), 'Cn=50 -> μr ≈ 0.064');
  
  // Test 5: Pérdida por rodadura (verificar que usa 274.4)
  console.log('\n[RESISTENCIA] Test: calculateRollingResistanceHP');
  // Cálculo manual: W=5000kg, Cn=50 -> μr=0.064, cos(0)=1, F=320kgf
  // v=8km/h = 2.222m/s, P=320*2.222=710.93 kgf*m/s
  // HP = 710.93 / 274.4 = 2.59 HP
  const rollLoss = calculateRollingResistanceHP(5000, 50, 0, 8);
  assert(approxEqual(rollLoss, 2.59, 0.1), 'Rodadura en terreno plano ≈ 2.59 HP');
  
  // Test 6: Pérdida por pendiente
  console.log('\n[PENDIENTE] Test: calculateSlopeLossHP');
  // W=5000kg, 10% slope -> θ=5.71°, sin(θ)=0.0995, F=497.5kgf
  // v=6km/h=1.667m/s, P=497.5*1.667=829.1 kgf*m/s
  // HP = 829.1 / 274.4 = 3.02 HP
  const slopeLoss = calculateSlopeLossHP(5000, 10, 6);
  assert(approxEqual(slopeLoss, 3.02, 0.1), 'Pendiente 10% a 6km/h ≈ 3.02 HP');
  assert(calculateSlopeLossHP(5000, 0, 6) === 0, 'Sin pendiente no hay pérdida');
  
  // Test 7: Pérdida por patinaje
  console.log('\n[PATINAJE] Test: calculateSlippageLossHP');
  const slipLoss = calculateSlippageLossHP(80, 15);
  assert(approxEqual(slipLoss, 12), '80HP con 15% patinaje = 12HP perdidos');
  assert(calculateSlippageLossHP(80, 0) === 0, 'Sin patinaje no hay pérdida');
  
  // Test 8: Función total
  console.log('\n[RESUMEN] Test: calculateTotalLoss');
  const result = calculateTotalLoss({
    enginePower: 120,
    altitudeMeters: 1500,
    temperatureC: 30,
    totalWeightKg: 5000,
    soilCn: 50,
    slopePercent: 10,
    speedKmh: 6,
    slippagePercent: 10,
  });
  
  assert(result.grossPower === 120, 'Potencia bruta = 120 HP');
  assert(result.losses.altitude > 0, 'Hay pérdida por altitud');
  assert(result.losses.temperature > 0, 'Hay pérdida por temperatura');
  assert(result.losses.transmission > 0, 'Hay pérdida por transmisión');
  assert(result.netPower > 0 && result.netPower < 120, 'Potencia neta es menor que bruta');
  assert(result.efficiency > 0 && result.efficiency < 100, 'Eficiencia está en rango válido');
  
  // Test 9: Conversiones de ángulos
  console.log('\n[ANGULOS] Test: Conversiones angulares');
  assert(approxEqual(degreesToRadians(180), Math.PI), '180° = π rad');
  assert(approxEqual(radiansToDegrees(Math.PI), 180), 'π rad = 180°');
  assert(approxEqual(slopePercentToDegrees(100), 45), '100% pendiente = 45°');
  assert(approxEqual(degreesToSlopePercent(45), 100), '45° = 100% pendiente');
  
  // Test 10: Constante HP correcta
  console.log('\n[CONSTANTES] Test: Constantes físicas');
  const constants = getConstants();
  assert(constants.HP_CONVERSION_FACTOR === 274.4, 'Factor HP = 274.4 (Paper)');
  assert(constants.BASE_TEMPERATURE_C === 15, 'Temperatura base = 15°C');
  
  // Resumen
  console.log('\n' + '='.repeat(50));
  console.log(`[RESUMEN] ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));
  
  return failed === 0;
};

// Ejecutar tests si este archivo es el punto de entrada
// En ES Modules, verificamos si es el módulo principal
const isMainModule = (() => {
  try {
    const scriptPath = process.argv[1];
    if (!scriptPath) return false;
    const normalizedScript = scriptPath.replace(/\\/g, '/');
    const normalizedUrl = import.meta.url.replace('file:///', '').replace('file://', '');
    return normalizedUrl.includes(normalizedScript.split('/').pop());
  } catch {
    return false;
  }
})();

if (isMainModule) {
  runTests();
}
