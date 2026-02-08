/**
 * Tests para Servicio de Recomendaciones
 * Valida el algoritmo de scoring y recomendación de tractores
 */

import { describe, test, expect } from '@jest/globals';
import {
  calculateScore,
  generateRecommendation
} from '../services/recommendationService.js';

describe('Recommendation Service Tests', () => {
  
  // ========== DATOS DE PRUEBA ==========
  const mockTerrain = {
    terrain_id: 1,
    soil_type: 'clay',
    slope_percentage: 8,
    altitude_meters: 2000,
    temperature_celsius: 18
  };

  const mockImplement = {
    implement_id: 1,
    implement_name: 'Arado de discos',
    power_requirement_hp: 50,
    working_depth_m: 0.3
  };

  const mockTractor1 = {
    tractor_id: 1,
    name: 'Tractor A',
    brand: 'John Deere',
    model: '5075E',
    engine_power_hp: 75,
    traction_type: '4x4',
    weight_kg: 3200,
    status: 'available'
  };

  const mockTractor2 = {
    tractor_id: 2,
    name: 'Tractor B',
    brand: 'Massey Ferguson',
    model: 'MF 290',
    engine_power_hp: 90,
    traction_type: '4x2',
    weight_kg: 2800,
    status: 'available'
  };

  const mockTractor3 = {
    tractor_id: 3,
    name: 'Tractor C',
    brand: 'New Holland',
    model: 'T4.75',
    engine_power_hp: 200,
    traction_type: '4x4',
    weight_kg: 5000,
    status: 'available'
  };

  // ========== CALCULATE SCORE ==========
  describe('calculateScore', () => {
    test('debe calcular score con breakdown completo', () => {
      const requiredPower = 60;
      const result = calculateScore(mockTractor1, mockImplement, mockTerrain, requiredPower);

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('maxPossible', 100);
      expect(result).toHaveProperty('percentageScore');

      // Validar breakdown
      expect(result.breakdown).toHaveProperty('efficiency');
      expect(result.breakdown).toHaveProperty('traction');
      expect(result.breakdown).toHaveProperty('soil');
      expect(result.breakdown).toHaveProperty('economic');
      expect(result.breakdown).toHaveProperty('availability');

      // El total debe ser la suma de los breakdown
      const sum = Object.values(result.breakdown).reduce((acc, val) => acc + val, 0);
      expect(Math.abs(result.total - sum)).toBeLessThan(0.01); // Tolerancia para redondeo
    });

    test('debe penalizar tractores sobredimensionados', () => {
      const requiredPower = 50;
      
      // Tractor ajustado (75 HP para 50 HP requeridos = 150%)
      const scoreAjustado = calculateScore(mockTractor1, mockImplement, mockTerrain, requiredPower);
      
      // Tractor sobredimensionado (200 HP para 50 HP requeridos = 400%)
      const scoreSobre = calculateScore(mockTractor3, mockImplement, mockTerrain, requiredPower);
      
      // El tractor ajustado debe tener mejor score de eficiencia
      expect(scoreAjustado.breakdown.efficiency).toBeGreaterThan(scoreSobre.breakdown.efficiency);
    });

    test('debe dar bonus a 4x4 en pendientes', () => {
      const terrainPendiente = { ...mockTerrain, slope_percentage: 18 }; // STEEP > 15%
      const requiredPower = 60;
      
      const score4x4 = calculateScore(mockTractor1, mockImplement, terrainPendiente, requiredPower);
      const score4x2 = calculateScore(mockTractor2, mockImplement, terrainPendiente, requiredPower);
      
      // 4x4 debe tener mejor score de tracción en pendientes
      expect(score4x4.breakdown.traction).toBeGreaterThan(score4x2.breakdown.traction);
    });

    test('debe calcular score de disponibilidad correctamente', () => {
      const tractorDisponible = { ...mockTractor1, status: 'available' };
      const tractorEnUso = { ...mockTractor1, status: 'in_use' };
      const tractorInactivo = { ...mockTractor1, status: 'inactive' };
      
      const requiredPower = 60;
      
      const scoreDisponible = calculateScore(tractorDisponible, mockImplement, mockTerrain, requiredPower);
      const scoreEnUso = calculateScore(tractorEnUso, mockImplement, mockTerrain, requiredPower);
      const scoreInactivo = calculateScore(tractorInactivo, mockImplement, mockTerrain, requiredPower);
      
      expect(scoreDisponible.breakdown.availability).toBe(10);
      expect(scoreEnUso.breakdown.availability).toBe(5);
      expect(scoreInactivo.breakdown.availability).toBe(0);
    });

    test('score total debe estar entre 0 y 100', () => {
      const requiredPower = 60;
      const result = calculateScore(mockTractor1, mockImplement, mockTerrain, requiredPower);
      
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.total).toBeLessThanOrEqual(100);
    });

    test('percentageScore debe ser coherente con total', () => {
      const requiredPower = 60;
      const result = calculateScore(mockTractor1, mockImplement, mockTerrain, requiredPower);
      
      const expectedPercentage = (result.total / 100) * 100;
      expect(Math.abs(result.percentageScore - expectedPercentage)).toBeLessThan(0.01);
    });
  });

  // ========== GENERATE RECOMMENDATION ==========
  describe('generateRecommendation', () => {
    test('debe generar recomendaciones con tractores disponibles', () => {
      const tractors = [mockTractor1, mockTractor2, mockTractor3];
      const requiredPower = 60;
      
      const result = generateRecommendation({
        terrain: mockTerrain,
        implement: mockImplement,
        tractors,
        requiredPower,
        options: { limit: 3 }
      });
      
      expect(result.success).toBe(true);
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeLessThanOrEqual(3);
    });

    test('recomendaciones deben estar ordenadas por score descendente', () => {
      const tractors = [mockTractor1, mockTractor2, mockTractor3];
      const requiredPower = 60;
      
      const result = generateRecommendation({
        terrain: mockTerrain,
        implement: mockImplement,
        tractors,
        requiredPower
      });
      
      // Verificar orden descendente
      for (let i = 0; i < result.recommendations.length - 1; i++) {
        expect(result.recommendations[i].score.total)
          .toBeGreaterThanOrEqual(result.recommendations[i + 1].score.total);
      }
    });

    test('cada recomendación debe tener rank secuencial', () => {
      const tractors = [mockTractor1, mockTractor2, mockTractor3];
      const requiredPower = 60;
      
      const result = generateRecommendation({
        terrain: mockTerrain,
        implement: mockImplement,
        tractors,
        requiredPower,
        options: { limit: 3 }
      });
      
      result.recommendations.forEach((rec, index) => {
        expect(rec.rank).toBe(index + 1);
      });
    });

    test('debe incluir terrainAnalysis en el resultado', () => {
      const tractors = [mockTractor1];
      const requiredPower = 60;
      
      const result = generateRecommendation({
        terrain: mockTerrain,
        implement: mockImplement,
        tractors,
        requiredPower
      });
      
      expect(result.terrainAnalysis).toBeDefined();
      expect(result.terrainAnalysis).toHaveProperty('classification');
      expect(result.terrainAnalysis).toHaveProperty('metrics');
      expect(result.terrainAnalysis).toHaveProperty('requirements');
    });

    test('debe incluir summary con estadísticas', () => {
      const tractors = [mockTractor1, mockTractor2];
      const requiredPower = 60;
      
      const result = generateRecommendation({
        terrain: mockTerrain,
        implement: mockImplement,
        tractors,
        requiredPower
      });
      
      expect(result.summary).toBeDefined();
      expect(result.summary.totalEvaluated).toBe(2);
      expect(result.summary.compatibleCount).toBeGreaterThan(0);
      expect(result.summary).toHaveProperty('topScore');
      expect(result.summary).toHaveProperty('topTractor');
    });

    test('debe manejar caso sin tractores compatibles', () => {
      const tractorDebil = { ...mockTractor1, engine_power_hp: 20 };
      const tractors = [tractorDebil];
      const requiredPower = 100; // Mucho más de lo que puede dar
      
      const result = generateRecommendation({
        terrain: mockTerrain,
        implement: mockImplement,
        tractors,
        requiredPower
      });
      
      expect(result.success).toBe(false);
      expect(result.recommendations).toEqual([]);
      expect(result.summary.compatibleCount).toBe(0);
      expect(result.summary).toHaveProperty('reason');
    });

    test('debe filtrar tractores con potencia insuficiente', () => {
      const tractorDebil = { ...mockTractor1, engine_power_hp: 30 };
      const tractorFuerte = { ...mockTractor1, engine_power_hp: 100 };
      const tractors = [tractorDebil, tractorFuerte];
      const requiredPower = 50;
      
      const result = generateRecommendation({
        terrain: mockTerrain,
        implement: mockImplement,
        tractors,
        requiredPower
      });
      
      // Solo el tractor fuerte debe aparecer
      expect(result.recommendations.length).toBe(1);
      expect(result.recommendations[0].tractor.engine_power_hp).toBe(100);
    });

    test('debe requerir 4WD en pendientes mayores a 15%', () => {
      const terrainEmpinado = { ...mockTerrain, slope_percentage: 20 };
      const tractor2WD = { ...mockTractor2, traction_type: '4x2', engine_power_hp: 100 };
      const tractor4WD = { ...mockTractor1, traction_type: '4x4', engine_power_hp: 100 };
      const tractors = [tractor2WD, tractor4WD];
      const requiredPower = 60;
      
      const result = generateRecommendation({
        terrain: terrainEmpinado,
        implement: mockImplement,
        tractors,
        requiredPower
      });
      
      // Solo tractores 4WD deben aparecer
      result.recommendations.forEach(rec => {
        const tractionType = rec.tractor.traction_type.toLowerCase();
        expect(tractionType).toMatch(/4x4|4wd|track/);
      });
    });

    test('debe incluir compatibility info en cada recomendación', () => {
      const tractors = [mockTractor1];
      const requiredPower = 60;
      
      const result = generateRecommendation({
        terrain: mockTerrain,
        implement: mockImplement,
        tractors,
        requiredPower
      });
      
      const rec = result.recommendations[0];
      expect(rec.compatibility).toBeDefined();
      expect(rec.compatibility).toHaveProperty('requiredPower');
      expect(rec.compatibility).toHaveProperty('tractorPower');
      expect(rec.compatibility).toHaveProperty('surplusHP');
      expect(rec.compatibility).toHaveProperty('utilizationPercent');
    });

    test('debe clasificar tractores como OPTIMAL/GOOD/OVERPOWERED', () => {
      const tractors = [mockTractor1, mockTractor2, mockTractor3];
      const requiredPower = 60;
      
      const result = generateRecommendation({
        terrain: mockTerrain,
        implement: mockImplement,
        tractors,
        requiredPower
      });
      
      result.recommendations.forEach(rec => {
        expect(rec.classification).toBeDefined();
        expect(rec.classification).toHaveProperty('label');
        expect(rec.classification).toHaveProperty('description');
        expect(['OPTIMAL', 'GOOD', 'OVERPOWERED', 'EXCESSIVE']).toContain(rec.classification.label);
      });
    });

    test('debe validar parámetros requeridos', () => {
      expect(() => {
        generateRecommendation({});
      }).toThrow('terrain es requerido');
      
      expect(() => {
        generateRecommendation({ terrain: mockTerrain });
      }).toThrow('tractors debe ser un array');
      
      expect(() => {
        generateRecommendation({ 
          terrain: mockTerrain, 
          tractors: [] 
        });
      }).toThrow('requiredPower debe ser un número positivo');
    });

    test('debe respetar el límite de recomendaciones', () => {
      const tractors = [mockTractor1, mockTractor2, mockTractor3];
      const requiredPower = 60;
      
      const result = generateRecommendation({
        terrain: mockTerrain,
        implement: mockImplement,
        tractors,
        requiredPower,
        options: { limit: 2 }
      });
      
      expect(result.recommendations.length).toBeLessThanOrEqual(2);
    });
  });
});
