import { beforeAll, afterAll, beforeEach, describe, expect, jest, test } from '@jest/globals';

const mockConnect = jest.fn();
const mockPoolQuery = jest.fn();
const mockTractorFindById = jest.fn();
const mockTractorGetAll = jest.fn();
const mockTerrainFindById = jest.fn();
const mockImplementFindById = jest.fn();
const mockCalculateTotalLoss = jest.fn();
const mockCalculateMinimumPower = jest.fn();
const mockLoggerInfo = jest.fn();

const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

jest.unstable_mockModule('../../../src/config/db.js', () => ({
  __esModule: true,
  pool: {
    connect: mockConnect,
    query: mockPoolQuery,
  },
}));

jest.unstable_mockModule('../../../src/models/Tractor.js', () => ({
  __esModule: true,
  default: {
    findById: mockTractorFindById,
    getAll: mockTractorGetAll,
  },
}));

jest.unstable_mockModule('../../../src/models/Terrain.js', () => ({
  __esModule: true,
  default: {
    findById: mockTerrainFindById,
  },
}));

jest.unstable_mockModule('../../../src/models/Implement.js', () => ({
  __esModule: true,
  default: {
    findById: mockImplementFindById,
  },
}));

jest.unstable_mockModule('../../../src/services/powerLossService.js', () => ({
  __esModule: true,
  calculateTotalLoss: mockCalculateTotalLoss,
}));

jest.unstable_mockModule('../../../src/services/minimumPowerService.js', () => ({
  __esModule: true,
  calculateMinimumPower: mockCalculateMinimumPower,
}));

jest.unstable_mockModule('../../../src/config/logger.js', () => ({
  __esModule: true,
  default: {
    info: mockLoggerInfo,
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const controller = await import('../../../src/controllers/calculationController.js');
const {
  calculatePowerLoss,
  calculateMinimumPower,
  getCalculationHistory,
} = controller;

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const callWrappedHandler = async (handler, req, res, next = jest.fn()) => {
  handler(req, res, next);
  await new Promise((resolve) => setImmediate(resolve));
  return next;
};

let consoleErrorSpy;

beforeAll(() => {
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  consoleErrorSpy.mockRestore();
});

describe('calculationController', () => {
  beforeEach(() => {
    [
      mockConnect,
      mockPoolQuery,
      mockTractorFindById,
      mockTractorGetAll,
      mockTerrainFindById,
      mockImplementFindById,
      mockCalculateTotalLoss,
      mockCalculateMinimumPower,
      mockLoggerInfo,
      mockClient.query,
      mockClient.release,
    ].forEach((mockFn) => mockFn.mockReset());
    mockConnect.mockResolvedValue(mockClient);
    mockClient.query.mockResolvedValue({ rows: [] });
  });

  describe('calculatePowerLoss()', () => {
    test('retorna 401 cuando no hay usuario autenticado en req.user', async () => {
      const req = {
        body: {
          tractor_id: 1,
          terrain_id: 2,
          working_speed_kmh: 8,
          user_id: 999,
        },
      };
      const res = createMockRes();

      await callWrappedHandler(calculatePowerLoss, req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuario no autenticado',
      });
      expect(mockTractorFindById).not.toHaveBeenCalled();
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('retorna 400 cuando faltan campos requeridos', async () => {
      const req = {
        body: { tractor_id: 1 },
        user: { user_id: 10 },
      };
      const res = createMockRes();

      await callWrappedHandler(calculatePowerLoss, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Faltan campos requeridos: tractor_id, terrain_id, working_speed_kmh',
      });
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('retorna 404 cuando el tractor no existe', async () => {
      const req = {
        body: {
          tractor_id: 1,
          terrain_id: 2,
          working_speed_kmh: 8,
        },
        user: { user_id: 10 },
      };
      const res = createMockRes();
      mockTractorFindById.mockResolvedValue(null);
      mockTerrainFindById.mockResolvedValue({ terrain_id: 2 });

      await callWrappedHandler(calculatePowerLoss, req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Tractor no encontrado',
      });
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('retorna 404 cuando el terreno no existe', async () => {
      const req = {
        body: {
          tractor_id: 1,
          terrain_id: 2,
          working_speed_kmh: 8,
        },
        user: { user_id: 10 },
      };
      const res = createMockRes();
      mockTractorFindById.mockResolvedValue({ tractor_id: 1, weight_kg: 5000, engine_power_hp: 120 });
      mockTerrainFindById.mockResolvedValue(null);

      await callWrappedHandler(calculatePowerLoss, req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Terreno no encontrado',
      });
    });

    test('persiste y responde cálculo de pérdidas exitoso', async () => {
      const req = {
        body: {
          tractor_id: 4,
          terrain_id: 6,
          working_speed_kmh: 7,
          carried_objects_weight_kg: 500,
          slippage_percent: 12,
          user_id: 77,
        },
        user: {
          user_id: 22,
        },
      };
      const res = createMockRes();

      mockTractorFindById.mockResolvedValue({
        tractor_id: 4,
        brand: 'John Deere',
        model: '6130M',
        weight_kg: 5000,
        engine_power_hp: 130,
      });
      mockTerrainFindById.mockResolvedValue({
        terrain_id: 6,
        name: 'Lote Norte',
        soil_type: 'arcilla',
        slope_percentage: 8,
        altitude_meters: 1500,
        temperature_celsius: 18,
      });
      mockCalculateTotalLoss.mockReturnValue({
        grossPower: 130,
        netPower: 101.5,
        efficiency: 78.08,
        losses: {
          slope: 5,
          altitude: 3,
          rollingResistance: 12,
          slippage: 8.5,
          total: 28.5,
        },
      });
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ query_id: 91 }] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      await callWrappedHandler(calculatePowerLoss, req, res);

        expect(mockCalculateTotalLoss).toHaveBeenCalledWith({
          enginePower: 130,
          altitudeMeters: 1500,
          temperatureC: 18,
          totalWeightKg: 5500,
          soilCn: 45,
          slopePercent: 8,
          speedKmh: 7,
          slippagePercent: 12,
          hasTurbo: false,
        });
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockLoggerInfo).toHaveBeenCalledWith('Power calculation completed', {
        queryId: 91,
        userId: 22,
        tractorId: 4,
        terrainId: 6,
        netPower: 101.5,
        efficiency: 78.08,
        totalLoss: 28.5,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            queryId: 91,
            net_power_hp: 101.5,
            engine_power_hp: 130,
            efficiency_percentage: 78.08,
          }),
        }),
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('hace rollback y delega error cuando falla la persistencia', async () => {
      const req = {
        body: {
          tractor_id: 2,
          terrain_id: 3,
          working_speed_kmh: 6,
        },
        user: { user_id: 10 },
      };
      const res = createMockRes();
      const next = jest.fn();
      const dbError = new Error('insert failed');

      mockTractorFindById.mockResolvedValue({
        tractor_id: 2,
        brand: 'Case',
        model: 'Puma',
        weight_kg: 4000,
        engine_power_hp: 100,
      });
      mockTerrainFindById.mockResolvedValue({
        terrain_id: 3,
        name: 'Campo Sur',
        soil_type: 'loam',
        slope_percentage: 2,
        altitude_meters: 500,
        temperature_celsius: 15,
      });
      mockCalculateTotalLoss.mockReturnValue({
        grossPower: 100,
        netPower: 88,
        efficiency: 88,
        losses: {
          slope: 1,
          altitude: 2,
          rollingResistance: 5,
          slippage: 4,
          total: 12,
        },
      });
      mockClient.query
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(dbError)
        .mockResolvedValueOnce({});

      await callWrappedHandler(calculatePowerLoss, req, res, next);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(next).toHaveBeenCalledWith(dbError);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('calculateMinimumPower()', () => {
    test('retorna 400 cuando faltan implement_id o terrain_id', async () => {
      const req = {
        body: {},
        user: { user_id: 4 },
      };
      const res = createMockRes();

      await calculateMinimumPower(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Faltan campos requeridos: implement_id, terrain_id',
      });
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('retorna 404 cuando implemento o terreno no existen', async () => {
      let req = {
        body: { implement_id: 8, terrain_id: 9 },
        user: { user_id: 4 },
      };
      let res = createMockRes();
      mockImplementFindById.mockResolvedValue(null);
      mockTerrainFindById.mockResolvedValue({ terrain_id: 9 });
      mockTractorGetAll.mockResolvedValue([]);

      await calculateMinimumPower(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Implemento no encontrado',
      });

      req = {
        body: { implement_id: 8, terrain_id: 9 },
        user: { user_id: 4 },
      };
      res = createMockRes();
      mockImplementFindById.mockResolvedValue({
        implement_id: 8,
        implement_name: 'Arado',
        power_requirement_hp: 70,
      });
      mockTerrainFindById.mockResolvedValue(null);
      mockTractorGetAll.mockResolvedValue([]);

      await calculateMinimumPower(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Terreno no encontrado',
      });
    });

    test('retorna respuesta sin persistir cuando no hay tractores compatibles', async () => {
      const req = {
        body: { implement_id: 8, terrain_id: 9 },
        user: { user_id: 14 },
      };
      const res = createMockRes();

      mockImplementFindById.mockResolvedValue({
        implement_id: 8,
        implement_name: 'Subsolador',
        implement_type: 'plow',
        brand: 'Maq',
        power_requirement_hp: 90,
        working_depth_cm: 35,
      });
      mockTerrainFindById.mockResolvedValue({
        terrain_id: 9,
        name: 'Ladera',
        soil_type: 'rocky',
        slope_percentage: 16,
      });
      mockTractorGetAll.mockResolvedValue([
        { tractor_id: 1, name: 'A', brand: 'X', model: '1', engine_power_hp: 80, status: 'available' },
      ]);
      mockCalculateMinimumPower.mockReturnValue({
        minimumPowerHP: 130,
        calculatedPowerHP: 113,
        factors: { soilFactor: 1.5 },
      });
      mockClient.query.mockResolvedValueOnce({}).mockResolvedValueOnce({});

      await calculateMinimumPower(req, res);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Cálculo de potencia mínima realizado (sin tractores compatibles)',
          data: expect.objectContaining({
            queryId: null,
            recommendations: {
              top_5: [],
              best_match: null,
            },
          }),
        }),
      );
    });

    test('persiste cálculo mínimo y clasifica tractores por idoneidad', async () => {
      const req = {
        body: {
          implement_id: 3,
          terrain_id: 5,
          working_depth_m: 0.3,
        },
        user: { userId: 22 },
      };
      const res = createMockRes();

      mockImplementFindById.mockResolvedValue({
        implement_id: 3,
        implement_name: 'Sembradora',
        implement_type: 'seeder',
        brand: 'Agro',
        power_requirement_hp: 80,
        working_depth_cm: 25,
      });
      mockTerrainFindById.mockResolvedValue({
        terrain_id: 5,
        name: 'Plano 1',
        soil_type: 'loam',
        slope_percentage: 3,
      });
      mockTractorGetAll.mockResolvedValue([
        { tractor_id: 10, name: 'Optimo', brand: 'JD', model: 'A', engine_power_hp: 110, status: 'available' },
        { tractor_id: 11, name: 'Grande', brand: 'Case', model: 'B', engine_power_hp: 180, status: 'available' },
        { tractor_id: 12, name: 'Corto', brand: 'NH', model: 'C', engine_power_hp: 95, status: 'available' },
        { tractor_id: 13, name: 'Inactivo', brand: 'NH', model: 'D', engine_power_hp: 150, status: 'inactive' },
      ]);
      mockCalculateMinimumPower.mockReturnValue({
        minimumPowerHP: 100,
        calculatedPowerHP: 87,
        factors: { slopeFactor: 1.1 },
      });
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ query_id: 81 }] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      await calculateMinimumPower(req, res);

      expect(mockCalculateMinimumPower).toHaveBeenCalledWith(
        {
          power_requirement_hp: 80,
          working_depth_m: 0.3,
        },
        {
          soil_type: 'loam',
          slope_percentage: 3,
        },
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            queryId: 81,
            tractorAnalysis: {
              total_evaluated: 4,
              summary: {
                optimal: 1,
                overpowered: 1,
                insufficient: 1,
              },
            },
            recommendations: {
              top_5: [
                expect.objectContaining({
                  tractor_id: 10,
                  rank: 1,
                }),
                expect.objectContaining({
                  tractor_id: 11,
                  rank: 2,
                }),
              ],
              best_match: expect.objectContaining({
                tractor_id: 10,
              }),
            },
          }),
        }),
      );
    });

    test('retorna 500 y rollback cuando ocurre un error inesperado', async () => {
      const req = {
        body: { implement_id: 3, terrain_id: 5 },
        user: { user_id: 2 },
      };
      const res = createMockRes();

      mockImplementFindById.mockResolvedValue({
        implement_id: 3,
        implement_name: 'Sembradora',
        power_requirement_hp: 80,
      });
      mockTerrainFindById.mockResolvedValue({
        terrain_id: 5,
        name: 'Plano 1',
        soil_type: 'loam',
        slope_percentage: 3,
      });
      mockTractorGetAll.mockResolvedValue([]);
      mockCalculateMinimumPower.mockImplementation(() => {
        throw new Error('service failed');
      });
      mockClient.query.mockResolvedValueOnce({});

      await calculateMinimumPower(req, res);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error procesando la solicitud de cálculo de potencia mínima',
        error: undefined,
      });
    });
  });

  describe('getCalculationHistory()', () => {
    test('retorna 400 con parámetros de paginación inválidos', async () => {
      const req = {
        user: { user_id: 9 },
        query: { page: '0', limit: '101' },
      };
      const res = createMockRes();

      await getCalculationHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Parámetros de paginación inválidos (page >= 1, 1 <= limit <= 100)',
      });
    });

    test('retorna historial con filtro de tipo semántico y metadatos de paginación', async () => {
      const req = {
        user: { user_id: 50 },
        query: { page: '2', limit: '2', type: 'requirement' },
      };
      const res = createMockRes();

      mockPoolQuery.mockImplementation((sql, params) => {
        if (sql.includes('COUNT(*) as total')) {
          expect(params).toEqual([50, 'minimum_power']);
          return Promise.resolve({ rows: [{ total: '3' }] });
        }

        expect(sql).toContain('q.query_type = $2');
        expect(params).toEqual([50, 'minimum_power', 2, 2]);
        return Promise.resolve({
          rows: [
            {
              history_id: 1,
              query_id: 90,
              action_date: '2026-03-20',
              action_type: 'minimum_power_calculation',
              description: 'Cálculo',
              result_json: { minimumPowerHP: 100 },
              query_type: 'minimum_power',
              query_date: '2026-03-20',
              status: 'completed',
              tractor_name: 'Optimo',
              tractor_brand: 'JD',
              tractor_model: 'A',
              terrain_name: 'Plano',
              implement_name: 'Sembradora',
              implement_type: 'seeder',
            },
          ],
        });
      });

      await getCalculationHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Historial de cálculos recuperado con éxito',
        data: {
          history: [
            {
              history_id: 1,
              query_id: 90,
              action_date: '2026-03-20',
              action_type: 'minimum_power_calculation',
              description: 'Cálculo',
              query_type: 'minimum_power',
              query_date: '2026-03-20',
              status: 'completed',
              entities: {
                tractor: {
                  name: 'Optimo',
                  brand: 'JD',
                  model: 'A',
                },
                terrain: {
                  name: 'Plano',
                },
                implement: {
                  name: 'Sembradora',
                  type: 'seeder',
                },
              },
              result_summary: { minimumPowerHP: 100 },
            },
          ],
          pagination: {
            current_page: 2,
            records_per_page: 2,
            total_records: 3,
            total_pages: 2,
            has_next_page: false,
            has_previous_page: true,
          },
          filters: {
            user_id: 50,
            type: 'requirement',
          },
        },
      });
    });

    test('retorna 500 cuando falla la consulta de historial', async () => {
      const req = {
        user: { user_id: 50 },
        query: {},
      };
      const res = createMockRes();
      mockPoolQuery.mockRejectedValueOnce(new Error('history failed'));

      await getCalculationHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error al recuperar el historial de cálculos',
        error: undefined,
      });
    });
  });
});
