/**
 * Tests unitarios para recommendationService
 * Verifica: analyzeTerrain, findCompatibleTractors, calculateScore, generateRecommendation
 *
 * Lógica de negocio compleja: "El Matchmaker Agrícola"
 */

import { jest, describe, test, expect } from "@jest/globals";
import * as recommendationService from "../../../src/services/recommendationService.js";

describe("recommendationService", () => {
  const {
    analyzeTerrain,
    findCompatibleTractors,
    calculateScore,
    calculateAdvancedScore,
    generateRecommendation,
    generateAdvancedRecommendation,
    normalizeSoilType,
    classifySlope,
    classifyTractorFit,
  } = recommendationService;

  // ==================== DATOS DE PRUEBA ====================

  const mockTractors = [
    {
      tractor_id: 1,
      name: "Tractor A (4WD, 100HP)",
      engine_power_hp: 100,
      traction_type: "4WD",
      status: "available",
      fuel_consumption_lph: 10,
    },
    {
      tractor_id: 2,
      name: "Tractor B (2WD, 90HP)",
      engine_power_hp: 90,
      traction_type: "2WD",
      status: "available",
      fuel_consumption_lph: 8,
    },
    {
      tractor_id: 3,
      name: "Tractor C (Oruga, 150HP)",
      engine_power_hp: 150,
      traction_type: "Track",
      status: "maintenance", // No disponible
    },
    {
      tractor_id: 4,
      name: "Tractor D (4WD, 200HP)", // Sobredimensionado
      engine_power_hp: 200,
      traction_type: "4x4",
      status: "available",
    },
  ];

  // ========================================================
  // 1. ANÁLISIS DE TERRENO
  // ========================================================
  describe("analyzeTerrain", () => {
    test("clasifica pendientes correctamente", () => {
      expect(classifySlope(3)).toBe("FLAT");
      expect(classifySlope(10)).toBe("ROLLING");
      expect(classifySlope(20)).toBe("STEEP");
    });

    test("normaliza tipos de suelo", () => {
      expect(normalizeSoilType("Arcilloso")).toBe("clay");
      expect(normalizeSoilType("Franco")).toBe("loam");
      expect(normalizeSoilType(null)).toBe("loam"); // Default
    });

    test("detecta requerimiento de 4WD en pendiente > 15%", () => {
      const result = analyzeTerrain({
        slope_percentage: 16,
        soil_type: "loam",
      });
      expect(result.classification.slopeClass).toBe("STEEP");
      expect(result.requirements.requires4WD).toBe(true);
    });

    test("calcula dificultad combinada", () => {
      const easy = analyzeTerrain({ slope_percentage: 0, soil_type: "sandy" });
      const hard = analyzeTerrain({ slope_percentage: 20, soil_type: "clay" });
      expect(hard.metrics.combinedDifficulty).toBeGreaterThan(
        easy.metrics.combinedDifficulty,
      );
    });
  });

  // ========================================================
  // 2. FILTRADO DE TRACTORES
  // ========================================================
  describe("findCompatibleTractors", () => {
    test("filtra por potencia mínima", () => {
      const required = 95;
      const filtered = findCompatibleTractors(
        { slope_percentage: 0, soil_type: "loam" },
        mockTractors,
        required,
      );
      // Solo Tractor A (100) y D (200) pasan. B (90) se queda fuera.
      expect(filtered).toHaveLength(2);
      expect(filtered.map((t) => t.tractor_id)).toEqual(
        expect.arrayContaining([1, 4]),
      );
    });

    test("aplica Regla de Oro (4WD en pendiente > 15%)", () => {
      // Tractor B es 2WD, debería ser filtrado aunque tenga potencia
      const steepTerrain = { slope_percentage: 18, soil_type: "loam" };
      const filtered = findCompatibleTractors(steepTerrain, mockTractors, 50);

      // Deberían quedar A (4WD) y D (4WD). B (2WD) fuera. C (Track) está en mantenimiento.
      expect(filtered.map((t) => t.tractor_id)).not.toContain(2);
    });

    test("filtra por disponibilidad por defecto", () => {
      const filtered = findCompatibleTractors(
        { slope_percentage: 0, soil_type: "loam" },
        mockTractors,
        50,
      );
      // Tractor C está 'maintenance'
      expect(filtered.map((t) => t.tractor_id)).not.toContain(3);
    });

    test("incluye no disponibles si se solicita", () => {
      const filtered = findCompatibleTractors(
        { slope_percentage: 0, soil_type: "loam" },
        mockTractors,
        50,
        { includeUnavailable: true },
      );
      // Ahora C debe aparecer
      expect(filtered.map((t) => t.tractor_id)).toContain(3);
    });
  });

  // ========================================================
  // 3. SCORING Y ALGORITMO
  // ========================================================
  describe("calculateScore", () => {
    const terrain = { slope_percentage: 10, soil_type: "loam" }; // Rolling, Moderate
    const implement = { power_requirement_hp: 80 };
    const requiredPower = 85; // Un poco más por pérdidas

    test("penaliza sobredimensionamiento excesivo", () => {
      // Tractor A (100HP) vs D (200HP) para requerimiento 85HP
      const scoreA = calculateScore(
        mockTractors[0],
        implement,
        terrain,
        requiredPower,
      );
      const scoreD = calculateScore(
        mockTractors[3],
        implement,
        terrain,
        requiredPower,
      );

      expect(scoreA.breakdown.efficiency).toBeGreaterThan(
        scoreD.breakdown.efficiency,
      );
    });

    test("otorga bonus de tracción a 4WD en pendiente", () => {
      const steep = { slope_percentage: 14, soil_type: "loam" }; // Rolling alto
      const score4WD = calculateScore(
        mockTractors[0],
        implement,
        steep,
        requiredPower,
      );
      const score2WD = calculateScore(
        mockTractors[1],
        implement,
        steep,
        requiredPower,
      ); // Asumiendo que pasó el filtro

      expect(score4WD.breakdown.traction).toBeGreaterThan(
        score2WD.breakdown.traction,
      );
    });

    test("calcula score económico basado en consumo", () => {
      // Tractor B consume 8L/h vs A 10L/h
      const scoreA = calculateScore(
        mockTractors[0],
        implement,
        terrain,
        requiredPower,
      );
      const scoreB = calculateScore(
        mockTractors[1],
        implement,
        terrain,
        requiredPower,
      );

      expect(scoreB.breakdown.economic).toBeGreaterThan(
        scoreA.breakdown.economic,
      );
    });
  });

  // ========================================================
  // 4. GENERACIÓN DE RECOMENDACIONES (INTEGRACIÓN)
  // ========================================================
  describe("generateRecommendation", () => {
    test("flujo completo: retorna top N ordenado", () => {
      const result = generateRecommendation({
        terrain: { slope_percentage: 5, soil_type: "clay" },
        implement: { power_requirement_hp: 80 },
        tractors: mockTractors,
        requiredPower: 85,
        options: { limit: 2 },
      });

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(2);
      expect(result.recommendations[0].rank).toBe(1);
      // El primero debe tener mayor score que el segundo
      expect(result.recommendations[0].score.total).toBeGreaterThanOrEqual(
        result.recommendations[1].score.total,
      );
    });

    test("maneja caso sin compatibilidad (lista vacía)", () => {
      const result = generateRecommendation({
        terrain: { slope_percentage: 20 }, // Steep -> requiere 4WD
        tractors: [mockTractors[1]], // Solo pasamos el 2WD
        requiredPower: 9000, // Imposible
        options: {},
      });

      expect(result.success).toBe(false);
      expect(result.recommendations).toHaveLength(0);
      expect(result.summary.reason).toBeDefined();
    });

    test("clasifica ajuste del tractor (Fit Classification)", () => {
      const utilization85 = classifyTractorFit(86);
      expect(utilization85.label).toBe("OPTIMAL");

      const utilization40 = classifyTractorFit(40);
      expect(utilization40.label).toBe("EXCESSIVE");
    });
  });

  // ========================================================
  // 5. ADVANCED SCORING E INTEGRACIÓN
  // ========================================================
  describe("Advanced Recommendation System", () => {
    const terrain = { slope_percentage: 5, soil_type: "loam" };
    const implement = { power_requirement_hp: 80 };
    const requiredPower = 85;

    const mockAdvancedTractors = [
      {
        tractor_id: 1,
        name: "Cheap John Deere",
        brand: "John Deere",
        engine_power_hp: 100,
        traction_type: "4WD",
        status: "available",
        price_usd: 40000,
        fuel_consumption_lph: 12,
      },
      {
        tractor_id: 2,
        name: "Expensive Premium",
        brand: "PremiumBrand",
        engine_power_hp: 100,
        traction_type: "4WD",
        status: "available",
        price_usd: 120000,
        fuel_consumption_lph: 9,
      },
    ];

    test("filtra por presupuesto máximo estricto", () => {
      const result = generateAdvancedRecommendation({
        terrain,
        implement,
        tractors: mockAdvancedTractors,
        requiredPower,
        filters: { budget: 50000 },
        options: { limit: 5 },
      });

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].tractor.brand).toBe("John Deere");
    });

    test("aplica boost por preferencia de marca (brandPreference)", () => {
      const result = generateAdvancedRecommendation({
        terrain,
        implement,
        tractors: mockAdvancedTractors,
        requiredPower,
        filters: { brandPreference: "PremiumBrand" },
        options: { limit: 5 },
      });

      expect(result.success).toBe(true);
      expect(result.recommendations[0].tractor.brand).toBe("PremiumBrand");
      expect(result.recommendations[0].score.breakdown.brand_preference).toBe(
        20,
      );
      expect(result.recommendations[1].score.breakdown.brand_preference).toBe(
        0,
      );
    });

    test("utiliza customWeights personalizados correctamente", () => {
      const customWeights = {
        power_match: 10,
        price: 80,
        brand_preference: 5,
        fuel_efficiency: 5,
      };

      const result = generateAdvancedRecommendation({
        terrain,
        implement,
        tractors: mockAdvancedTractors,
        requiredPower,
        filters: { budget: 150000 },
        customWeights,
        options: { limit: 5 },
      });

      expect(result.success).toBe(true);
      expect(result.recommendations[0].tractor.brand).toBe("John Deere");
      expect(result.recommendations[0].score.breakdown.price).toBeGreaterThan(
        result.recommendations[1].score.breakdown.price,
      );
      expect(result.recommendations[0].score.maxPossible).toBe(100);
    });
  });
});
