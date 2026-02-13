/**
 * Tests unitarios para powerLossService
 * Verifica cálculos físicos de pérdidas de potencia.
 */

import { jest, describe, test, expect } from "@jest/globals";
import * as powerLossService from "../../../src/services/powerLossService.js";

describe("powerLossService", () => {
  const {
    calculateAltitudeLoss,
    calculateTemperatureLoss,
    calculateSlopeLossHP,
    calculateRollingResistanceHP,
    calculateTransmissionLoss,
    calculateSlippageLossHP,
    calculateTotalLoss,
    degreesToRadians,
    slopePercentToDegrees,
  } = powerLossService;

  // ========================================================
  // 1. PÉRDIDAS ATMOSFÉRICAS
  // ========================================================
  describe("calculateAltitudeLoss", () => {
    test("calcula correctamente pérdida a 1500m (5%)", () => {
      // 1500m / 300m = 5 iteraciones * 1% = 5%
      const loss = calculateAltitudeLoss(100, 1500);
      expect(loss).toBeCloseTo(5.0);
    });

    test("retorna 0 si está a nivel del mar o abajo", () => {
      expect(calculateAltitudeLoss(100, 0)).toBe(0);
      expect(calculateAltitudeLoss(100, -50)).toBe(0);
    });
  });

  describe("calculateTemperatureLoss", () => {
    test("calcula correctamente pérdida a 35°C (4%)", () => {
      // (35 - 15) / 5 = 4 iteraciones * 1% = 4%
      const loss = calculateTemperatureLoss(100, 35);
      expect(loss).toBeCloseTo(4.0);
    });

    test("retorna 0 si temperatura es <= 15°C", () => {
      expect(calculateTemperatureLoss(100, 15)).toBe(0);
      expect(calculateTemperatureLoss(100, 10)).toBe(0);
    });
  });

  // ========================================================
  // 2. PÉRDIDAS MECÁNICAS
  // ========================================================
  describe("calculateTransmissionLoss", () => {
    test("usa factor default 0.13", () => {
      expect(calculateTransmissionLoss(100)).toBeCloseTo(13.0);
    });

    test("usa factor personalizado", () => {
      expect(calculateTransmissionLoss(100, 0.15)).toBeCloseTo(15.0);
    });
  });

  // ========================================================
  // 3. PÉRDIDAS POR TERRENO
  // ========================================================
  describe("calculateRollingResistanceHP", () => {
    test("calcula resistencia en terreno plano", () => {
      // Caso manual: W=5000, Cn=50 (μr=0.064), slope=0, v=8km/h
      // Fn = 5000
      // Fr = 0.064 * 5000 = 320 kgf
      // P = 320 * (8/3.6) = 711.11 kgf*m/s
      // HP = 711.11 / 274.4 = 2.59 HP
      const loss = calculateRollingResistanceHP(5000, 50, 0, 8);
      expect(loss).toBeCloseTo(2.59, 1);
    });

    test("aumenta en suelos blandos (Cn bajo)", () => {
      const hardSoil = calculateRollingResistanceHP(5000, 100, 0, 5);
      const softSoil = calculateRollingResistanceHP(5000, 20, 0, 5);
      expect(softSoil).toBeGreaterThan(hardSoil);
    });
  });

  describe("calculateSlopeLossHP", () => {
    test("calcula pérdida por pendiente positiva", () => {
      // W=5000, 10% slope (5.71°), v=6km/h
      // F = 5000 * sin(5.71°) = 497.5 kgf
      // P = 497.5 * 1.66 = 829.1 kgf*m/s
      // HP = 829.1 / 274.4 = 3.02 HP
      const loss = calculateSlopeLossHP(5000, 10, 6);
      expect(loss).toBeCloseTo(3.02, 1);
    });

    test("retorna 0 en terreno plano o bajada", () => {
      expect(calculateSlopeLossHP(5000, 0, 6)).toBe(0);
      expect(calculateSlopeLossHP(5000, -5, 6)).toBe(0);
    });
  });

  // ========================================================
  // 4. PÉRDIDAS POR PATINAJE
  // ========================================================
  describe("calculateSlippageLossHP", () => {
    test("calcula porcentaje directo de potencia", () => {
      expect(calculateSlippageLossHP(80, 15)).toBeCloseTo(12.0); // 15% de 80
    });
  });

  // ========================================================
  // 5. INTEGRACIÓN (TOTAL LOSS)
  // ========================================================
  describe("calculateTotalLoss", () => {
    test("ejecuta flujo completo y retorna estructura correcta", () => {
      const result = calculateTotalLoss({
        enginePower: 120,
        altitudeMeters: 1500, // -6 HP
        temperatureC: 30, // -3.6 HP (aprox)
        totalWeightKg: 5000,
        soilCn: 50,
        slopePercent: 10,
        speedKmh: 6,
        slippagePercent: 10,
      });

      expect(result).toHaveProperty("grossPower", 120);
      expect(result).toHaveProperty("netPower");
      expect(result).toHaveProperty("efficiency");
      expect(result.losses).toHaveProperty("altitude");
      expect(result.losses.total).toBeGreaterThan(0);
      expect(result.netPower).toBeLessThan(120);
    });

    test("maneja potencia insuficiente (netPower 0)", () => {
      // Caso extremo: pendiente imposible
      const result = calculateTotalLoss({
        enginePower: 50,
        altitudeMeters: 0,
        temperatureC: 15,
        totalWeightKg: 10000, // Muy pesado para 50HP
        soilCn: 20,
        slopePercent: 50, // Pendiente extrema
        speedKmh: 10,
        slippagePercent: 20,
      });

      expect(result.netPower).toBe(0);
    });
  });

  // ========================================================
  // 6. UTILIDADES
  // ========================================================
  describe("Utility Functions", () => {
    test("conversiones angulares correctas", () => {
      expect(degreesToRadians(180)).toBeCloseTo(Math.PI);
      expect(slopePercentToDegrees(100)).toBeCloseTo(45.0);
    });
  });
});
