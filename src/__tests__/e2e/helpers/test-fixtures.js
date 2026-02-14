/**
 * Test Data Factory
 * Proporciona métodos para crear datos de prueba de forma consistente
 */

import bcrypt from 'bcryptjs';
import { generateToken } from '../../../utils/jwt.util.js';
import { pool } from '../../../config/db.js';

/**
 * Factory class para crear datos de prueba
 */
export class TestDataFactory {
  /**
   * Crea un usuario autenticado y retorna el token JWT
   * @param {number} role_id - ID del rol (1=admin, 2=normal)
   * @param {Object} overrides - Propiedades personalizadas del usuario
   * @returns {Promise<Object>} { user, token }
   */
  static async createAuthenticatedUser(role_id = 2, overrides = {}) {
    const timestamp = Date.now();
    const name = overrides.name || `testuser_${timestamp}`;
    const email = overrides.email || `test_${timestamp}@test.com`;
    const password = overrides.password || 'Test123!';

    // Hash password
    const salt = await bcrypt.genSalt(4); // Menor para tests más rápidos
    const passwordHash = await bcrypt.hash(password, salt);

    // Insertar usuario en DB
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role_id)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, name, email, role_id, registration_date`,
      [name, email, passwordHash, role_id]
    );

    const user = result.rows[0];

    // Generar token JWT
    const token = generateToken({
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role_id: user.role_id
    });

    return { user, token };
  }

  /**
   * Crea un terreno de prueba
   * @param {number} user_id - ID del usuario propietario
   * @param {Object} overrides - Propiedades personalizadas del terreno
   * @returns {Promise<Object>} Terrain object
   */
  static async createTerrain(user_id, overrides = {}) {
    const timestamp = Date.now();
    const defaults = {
      name: `Test Terrain ${timestamp}`,
      altitude_meters: overrides.altitude_meters || 1500,
      slope_percentage: overrides.slope_percentage || 10.0,
      soil_type: overrides.soil_type || 'clay',
      temperature_celsius: overrides.temperature_celsius || 22.0
    };

    const terrain = { ...defaults, ...overrides };

    const result = await pool.query(
      `INSERT INTO terrain 
       (name, altitude_meters, slope_percentage, soil_type, temperature_celsius, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        terrain.name,
        terrain.altitude_meters,
        terrain.slope_percentage,
        terrain.soil_type,
        terrain.temperature_celsius,
        user_id
      ]
    );

    return result.rows[0];
  }

  /**
   * Crea un tractor de prueba
   * @param {Object} overrides - Propiedades personalizadas del tractor
   * @returns {Promise<Object>} Tractor object
   */
  static async createTractor(overrides = {}) {
    const timestamp = Date.now();
    const defaults = {
      name: overrides.name || `Tractor Test ${timestamp}`,
      brand: overrides.brand || 'TestBrand',
      model: overrides.model || `Model_${timestamp}`,
      engine_power_hp: overrides.engine_power_hp || 85,
      weight_kg: overrides.weight_kg || 3500,
      traction_force_kn: overrides.traction_force_kn || 35.0,
      traction_type: overrides.traction_type || '4x4'
    };

    const tractor = { ...defaults, ...overrides };

    const result = await pool.query(
      `INSERT INTO tractor 
       (name, brand, model, engine_power_hp, weight_kg, traction_force_kn, traction_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        tractor.name,
        tractor.brand,
        tractor.model,
        tractor.engine_power_hp,
        tractor.weight_kg,
        tractor.traction_force_kn,
        tractor.traction_type
      ]
    );

    return result.rows[0];
  }

  /**
   * Crea un implemento de prueba
   * @param {Object} overrides - Propiedades personalizadas del implemento
   * @returns {Promise<Object>} Implement object
   */
  static async createImplement(overrides = {}) {
    const timestamp = Date.now();
    const defaults = {
      implement_name: overrides.implement_name || `Test Implement ${timestamp}`,
      brand: overrides.brand || 'TestBrand',
      implement_type: overrides.implement_type || 'plow',
      power_requirement_hp: overrides.power_requirement_hp || 50,
      working_width_m: overrides.working_width_m || 2.5,
      working_depth_cm: overrides.working_depth_cm || 25,
      weight_kg: overrides.weight_kg || 500
    };

    const implement = { ...defaults, ...overrides };

    const result = await pool.query(
      `INSERT INTO implement 
       (implement_name, brand, implement_type, power_requirement_hp, working_width_m, working_depth_cm, weight_kg)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        implement.implement_name,
        implement.brand,
        implement.implement_type,
        implement.power_requirement_hp,
        implement.working_width_m,
        implement.working_depth_cm,
        implement.weight_kg
      ]
    );

    return result.rows[0];
  }

  /**
   * Crea un setup completo para tests de recomendación
   * @returns {Promise<Object>} { user, token, terrain, tractor, implement }
   */
  static async createCompleteSetup() {
    const { user, token } = await this.createAuthenticatedUser();
    const terrain = await this.createTerrain(user.user_id);
    const tractor = await this.createTractor();
    const implement = await this.createImplement();

    return { user, token, terrain, tractor, implement };
  }
}

export default TestDataFactory;
