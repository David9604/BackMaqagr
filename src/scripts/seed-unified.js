/**
 * @overview Sistema Unificado de Seed y Generación de Datos de Prueba
 * @module scripts/seed-unified
 * 
 * @description
 * Script consolidado para gestionar datos de prueba del sistema MaqAgr.
 * Incluye generador de datos configurables para diferentes escenarios de QA.
 * 
 * @requires Variables de Entorno (archivo .env en la raíz del proyecto):
 *   - DB_USER      Usuario de PostgreSQL (default: 'postgres')
 *   - DB_HOST      Host de la base de datos (default: 'localhost')
 *   - DB_NAME      Nombre de la base de datos (default: 'MaqAgr')
 *   - DB_PASS      Contraseña de PostgreSQL (REQUERIDO - sin default)
 *   - DB_PORT      Puerto de PostgreSQL (default: 5432)
 * 
 * @important El script requiere una conexión válida a PostgreSQL.
 *            Asegúrese de que el archivo .env esté correctamente configurado.
 * 
 * Uso:
 *   node src/scripts/seed-unified.js [--clean] [--scenario=<nombre>]
 * 
 * Opciones:
 *   --clean       Limpia duplicados antes de insertar
 *   --scenario    Escenario de prueba: 'basic', 'qa', 'full', 'efficiency', 'montana'
 * 
 * @example
 *   node src/scripts/seed-unified.js --clean --scenario=qa
 */

import { pool } from '../config/db.js';
import bcrypt from 'bcrypt';

// CONFIGURACIÓN Y CONSTANTES

const CONFIG = {
  SALT_ROUNDS: 10,
  DEFAULT_PASSWORD: 'demo123',
  QA_USER_EMAIL: 'qa@maqagr.com',
};

const ASCII = {
  header: `
╔════════════════════════════════════════════════════════════════════════════╗
║     🌱 SEED UNIFICADO - MaqAgr Database Management                         ║
╚════════════════════════════════════════════════════════════════════════════╝`,
  section: (title) => `\n═══════════════════════════════════════════════════════════
  ${title}
═══════════════════════════════════════════════════════════`,
  ok: '✅',
  warn: '⚠️',
  error: '❌',
  info: 'ℹ️',
};

// GENERADOR DE DATOS DE PRUEBA

/**
 * Generador de datos de prueba configurables
 */
const DataGenerator = {
  /**
   * Genera datos de tractores para diferentes escenarios
   */
  tractors: {
    // Tractor pequeño para pruebas de eficiencia
    compact: (suffix = '') => ({
      name: `Tractor Compacto 35HP${suffix}`,
      brand: 'Kubota',
      model: 'L3301',
      engine_power_hp: 35,
      weight_kg: 1200,
      traction_force_kn: 15,
      traction_type: '4x4',
      tire_type: 'Radial 9.5-24',
    }),
    
    // Tractor mediano 2WD para pruebas de Regla de Oro
    medium2WD: (suffix = '') => ({
      name: `Tractor Mediano 2WD${suffix}`,
      brand: 'New Holland',
      model: 'TT3.55',
      engine_power_hp: 55,
      weight_kg: 2800,
      traction_force_kn: 38,
      traction_type: '4x2',
      tire_type: 'Diagonal 14.9-28',
    }),
    
    // Tractor mediano 4WD
    medium4WD: (suffix = '') => ({
      name: `Tractor Mediano 4WD${suffix}`,
      brand: 'John Deere',
      model: '5075E',
      engine_power_hp: 75,
      weight_kg: 3200,
      traction_force_kn: 45,
      traction_type: '4x4',
      tire_type: 'Radial 16.9R30',
    }),
    
    // Tractor grande 4WD
    large4WD: (suffix = '') => ({
      name: `Tractor Grande 4WD${suffix}`,
      brand: 'Massey Ferguson',
      model: '4709',
      engine_power_hp: 90,
      weight_kg: 3500,
      traction_force_kn: 52,
      traction_type: '4x4',
      tire_type: 'Radial 18.4R34',
    }),
    
    // Tractor de orugas para terrenos difíciles
    track: (suffix = '') => ({
      name: `Tractor Orugas${suffix}`,
      brand: 'Caterpillar',
      model: 'Challenger MT765',
      engine_power_hp: 120,
      weight_kg: 5500,
      traction_force_kn: 85,
      traction_type: 'track',
      tire_type: 'Track System',
    }),
  },
  
  /**
   * Genera datos de terrenos para diferentes escenarios
   */
  terrains: {
    // Terreno plano para pruebas de eficiencia
    flat: (userId, suffix = '') => ({
      user_id: userId,
      name: `Valle Plano${suffix}`,
      altitude_meters: 500,
      slope_percentage: 3,
      soil_type: 'Franco',
      temperature_celsius: 25,
    }),
    
    // Terreno ondulado (rolling)
    rolling: (userId, suffix = '') => ({
      user_id: userId,
      name: `Terreno Ondulado${suffix}`,
      altitude_meters: 800,
      slope_percentage: 10,
      soil_type: 'Franco',
      temperature_celsius: 22,
    }),
    
    // Terreno empinado para Regla de Oro (>15%)
    steep: (userId, suffix = '') => ({
      user_id: userId,
      name: `Montaña Empinada${suffix}`,
      altitude_meters: 2500,
      slope_percentage: 20,
      soil_type: 'Arcilla',
      temperature_celsius: 15,
    }),
    
    // Terreno arenoso costero
    sandy: (userId, suffix = '') => ({
      user_id: userId,
      name: `Costa Arenosa${suffix}`,
      altitude_meters: 50,
      slope_percentage: 2,
      soil_type: 'Arena',
      temperature_celsius: 28,
    }),
    
    // Terreno arcilloso pesado
    clay: (userId, suffix = '') => ({
      user_id: userId,
      name: `Suelo Arcilloso${suffix}`,
      altitude_meters: 1200,
      slope_percentage: 8,
      soil_type: 'Arcilla',
      temperature_celsius: 20,
    }),
  },
  
  /**
   * Genera datos de implementos para diferentes escenarios
   */
  implements: {
    // Implemento ligero (bajo HP) para pruebas de sobredimensionamiento
    light: (suffix = '') => ({
      implement_name: `Sembradora Ligera${suffix}`,
      brand: 'Semeato',
      power_requirement_hp: 25,
      working_width_m: 1.2,
      soil_type: 'Franco',
      implement_type: 'seeder',
      working_depth_cm: 8,
      weight_kg: 350,
    }),
    
    // Implemento mediano para pruebas de eficiencia óptima
    medium: (suffix = '') => ({
      implement_name: `Cultivador Mediano${suffix}`,
      brand: 'Baldan',
      power_requirement_hp: 30,
      working_width_m: 2.0,
      soil_type: 'Franco',
      implement_type: 'cultivator',
      working_depth_cm: 25,
      weight_kg: 450,
    }),
    
    // Implemento pesado para pruebas de potencia insuficiente
    heavy: (suffix = '') => ({
      implement_name: `Subsolador Pesado${suffix}`,
      brand: 'Tatu',
      power_requirement_hp: 80,
      working_width_m: 2.5,
      soil_type: 'Arcilla',
      implement_type: 'subsoiler',
      working_depth_cm: 45,
      weight_kg: 850,
    }),
    
    // Arado de discos
    plow: (suffix = '') => ({
      implement_name: `Arado Discos${suffix}`,
      brand: 'Baldan',
      power_requirement_hp: 50,
      working_width_m: 0.9,
      soil_type: 'Franco',
      implement_type: 'plow',
      working_depth_cm: 30,
      weight_kg: 600,
    }),
    
    // Rastra
    harrow: (suffix = '') => ({
      implement_name: `Rastra 20 Discos${suffix}`,
      brand: 'Tatu',
      power_requirement_hp: 35,
      working_width_m: 1.8,
      soil_type: 'Franco',
      implement_type: 'harrow',
      working_depth_cm: 15,
      weight_kg: 500,
    }),
  },
  
  /**
   * Genera usuario de QA con password hasheado
   */
  async qaUser() {
    const hashedPassword = await bcrypt.hash(CONFIG.DEFAULT_PASSWORD, CONFIG.SALT_ROUNDS);
    return {
      name: 'QA Tester',
      email: CONFIG.QA_USER_EMAIL,
      password: hashedPassword,
      role_id: 2,
      status: 'active',
    };
  },
};

// ESCENARIOS DE SEED PREDEFINIDOS

/**
 * Escenarios de datos predefinidos
 */
const Scenarios = {
  /**
   * Escenario básico: mínimo necesario para desarrollo
   */
  basic: {
    tractors: ['medium4WD'],
    terrains: ['flat'],
    implements: ['medium'],
  },
  
  /**
   * Escenario QA completo: cubre todos los casos de prueba
   * - Regla de Oro (pendiente > 15%)
   * - Eficiencia (tractores pequeños vs grandes)
   * - Clasificaciones (OPTIMAL, GOOD, OVERPOWERED, EXCESSIVE)
   */
  qa: {
    tractors: ['compact', 'medium2WD', 'medium4WD', 'large4WD'],
    terrains: ['flat', 'steep'],
    implements: ['light', 'medium', 'heavy'],
  },
  
  /**
   * Escenario completo: todos los tipos de datos
   */
  full: {
    tractors: ['compact', 'medium2WD', 'medium4WD', 'large4WD', 'track'],
    terrains: ['flat', 'rolling', 'steep', 'sandy', 'clay'],
    implements: ['light', 'medium', 'heavy', 'plow', 'harrow'],
  },
  
  /**
   * Escenario eficiencia: pruebas de sobredimensionamiento
   */
  efficiency: {
    tractors: ['compact', 'medium2WD', 'medium4WD'],
    terrains: ['flat', 'rolling'],
    implements: ['light', 'medium'],
  },
  
  /**
   * Escenario montaña: pruebas de Regla de Oro
   */
  montana: {
    tractors: ['medium2WD', 'medium4WD', 'large4WD', 'track'],
    terrains: ['steep', 'rolling'],
    implements: ['medium', 'heavy'],
  },
};

// FUNCIONES DE BASE DE DATOS

/**
 * Limpia duplicados de la base de datos
 */
async function cleanDuplicates(client) {
  console.log(ASCII.section('🧹 LIMPIEZA DE DUPLICADOS'));
  
  // Limpiar usuarios duplicados (mantener el primero)
  const usersDeleted = await client.query(`
    DELETE FROM users 
    WHERE user_id NOT IN (
      SELECT MIN(user_id) FROM users GROUP BY email
    )
    RETURNING user_id, email
  `);
  console.log(`${ASCII.ok} Usuarios duplicados eliminados: ${usersDeleted.rowCount}`);
  
  // Limpiar terrenos duplicados (por nombre y user_id)
  const terrainsDeleted = await client.query(`
    DELETE FROM terrain 
    WHERE terrain_id NOT IN (
      SELECT MIN(terrain_id) FROM terrain GROUP BY name, COALESCE(user_id, -1)
    )
    RETURNING terrain_id, name
  `);
  console.log(`${ASCII.ok} Terrenos duplicados eliminados: ${terrainsDeleted.rowCount}`);
  
  // Limpiar tractores duplicados (por nombre y modelo)
  const tractorsDeleted = await client.query(`
    DELETE FROM tractor 
    WHERE tractor_id NOT IN (
      SELECT MIN(tractor_id) FROM tractor GROUP BY name, brand, model
    )
    RETURNING tractor_id, name
  `);
  console.log(`${ASCII.ok} Tractores duplicados eliminados: ${tractorsDeleted.rowCount}`);
  
  // Limpiar implementos duplicados (por nombre y marca)
  const implementsDeleted = await client.query(`
    DELETE FROM implement 
    WHERE implement_id NOT IN (
      SELECT MIN(implement_id) FROM implement GROUP BY implement_name, brand
    )
    RETURNING implement_id, implement_name
  `);
  console.log(`${ASCII.ok} Implementos duplicados eliminados: ${implementsDeleted.rowCount}`);
  
  return {
    users: usersDeleted.rowCount,
    terrains: terrainsDeleted.rowCount,
    tractors: tractorsDeleted.rowCount,
    implements: implementsDeleted.rowCount,
  };
}

/**
 * Obtiene o crea el usuario de QA
 */
async function getOrCreateQAUser(client) {
  // Buscar usuario existente
  const existing = await client.query(
    'SELECT user_id, email FROM users WHERE email = $1',
    [CONFIG.QA_USER_EMAIL]
  );
  
  if (existing.rows.length > 0) {
    console.log(`${ASCII.info} Usuario QA existente: ID ${existing.rows[0].user_id}`);
    return existing.rows[0].user_id;
  }
  
  // Crear nuevo usuario
  const userData = await DataGenerator.qaUser();
  const result = await client.query(`
    INSERT INTO users (name, email, password, role_id, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING user_id
  `, [userData.name, userData.email, userData.password, userData.role_id, userData.status]);
  
  console.log(`${ASCII.ok} Usuario QA creado: ID ${result.rows[0].user_id}`);
  return result.rows[0].user_id;
}

/**
 * Inserta tractores del escenario
 */
async function insertTractors(client, tractorTypes) {
  console.log(ASCII.section('🚜 INSERTANDO TRACTORES'));
  const inserted = [];
  
  for (const type of tractorTypes) {
    const generator = DataGenerator.tractors[type];
    if (!generator) {
      console.log(`${ASCII.warn} Tipo de tractor desconocido: ${type}`);
      continue;
    }
    
    const data = generator();
    
    // Verificar si ya existe
    const existing = await client.query(
      'SELECT tractor_id FROM tractor WHERE name = $1 AND brand = $2 AND model = $3',
      [data.name, data.brand, data.model]
    );
    
    if (existing.rows.length > 0) {
      console.log(`${ASCII.info} Tractor existente: ${data.name} (ID: ${existing.rows[0].tractor_id})`);
      inserted.push({ id: existing.rows[0].tractor_id, ...data });
      continue;
    }
    
    const result = await client.query(`
      INSERT INTO tractor (name, brand, model, engine_power_hp, weight_kg, traction_force_kn, traction_type, tire_type, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'available')
      RETURNING tractor_id
    `, [data.name, data.brand, data.model, data.engine_power_hp, data.weight_kg, 
        data.traction_force_kn, data.traction_type, data.tire_type]);
    
    console.log(`${ASCII.ok} Tractor creado: ${data.name} (${data.engine_power_hp} HP, ${data.traction_type}) → ID ${result.rows[0].tractor_id}`);
    inserted.push({ id: result.rows[0].tractor_id, ...data });
  }
  
  return inserted;
}

/**
 * Inserta terrenos del escenario
 */
async function insertTerrains(client, terrainTypes, userId) {
  console.log(ASCII.section('🏔️ INSERTANDO TERRENOS'));
  const inserted = [];
  
  for (const type of terrainTypes) {
    const generator = DataGenerator.terrains[type];
    if (!generator) {
      console.log(`${ASCII.warn} Tipo de terreno desconocido: ${type}`);
      continue;
    }
    
    const data = generator(userId);
    
    // Verificar si ya existe para este usuario
    const existing = await client.query(
      'SELECT terrain_id FROM terrain WHERE name = $1 AND user_id = $2',
      [data.name, userId]
    );
    
    if (existing.rows.length > 0) {
      console.log(`${ASCII.info} Terreno existente: ${data.name} (ID: ${existing.rows[0].terrain_id})`);
      inserted.push({ id: existing.rows[0].terrain_id, ...data });
      continue;
    }
    
    const result = await client.query(`
      INSERT INTO terrain (user_id, name, altitude_meters, slope_percentage, soil_type, temperature_celsius, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'active')
      RETURNING terrain_id
    `, [data.user_id, data.name, data.altitude_meters, data.slope_percentage, 
        data.soil_type, data.temperature_celsius]);
    
    console.log(`${ASCII.ok} Terreno creado: ${data.name} (${data.slope_percentage}% pendiente, ${data.soil_type}) → ID ${result.rows[0].terrain_id}`);
    inserted.push({ id: result.rows[0].terrain_id, ...data });
  }
  
  return inserted;
}

/**
 * Inserta implementos del escenario
 */
async function insertImplements(client, implementTypes) {
  console.log(ASCII.section('🔧 INSERTANDO IMPLEMENTOS'));
  const inserted = [];
  
  for (const type of implementTypes) {
    const generator = DataGenerator.implements[type];
    if (!generator) {
      console.log(`${ASCII.warn} Tipo de implemento desconocido: ${type}`);
      continue;
    }
    
    const data = generator();
    
    // Verificar si ya existe
    const existing = await client.query(
      'SELECT implement_id FROM implement WHERE implement_name = $1 AND brand = $2',
      [data.implement_name, data.brand]
    );
    
    if (existing.rows.length > 0) {
      console.log(`${ASCII.info} Implemento existente: ${data.implement_name} (ID: ${existing.rows[0].implement_id})`);
      inserted.push({ id: existing.rows[0].implement_id, ...data });
      continue;
    }
    
    const result = await client.query(`
      INSERT INTO implement (implement_name, brand, power_requirement_hp, working_width_m, soil_type, implement_type, working_depth_cm, weight_kg, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'available')
      RETURNING implement_id
    `, [data.implement_name, data.brand, data.power_requirement_hp, data.working_width_m,
        data.soil_type, data.implement_type, data.working_depth_cm, data.weight_kg]);
    
    console.log(`${ASCII.ok} Implemento creado: ${data.implement_name} (${data.power_requirement_hp} HP) → ID ${result.rows[0].implement_id}`);
    inserted.push({ id: result.rows[0].implement_id, ...data });
  }
  
  return inserted;
}


// FUNCIÓN PRINCIPAL


async function seedUnified(options = {}) {
  const { clean = false, scenario = 'qa' } = options;
  const client = await pool.connect();
  
  try {
    console.log(ASCII.header);
    console.log(`\n📋 Escenario: ${scenario.toUpperCase()}`);
    console.log(`🧹 Limpieza: ${clean ? 'Sí' : 'No'}\n`);
    
    await client.query('BEGIN');
    
    // Paso 1: Limpiar duplicados si se solicitó
    if (clean) {
      await cleanDuplicates(client);
    }
    
    // Paso 2: Obtener configuración del escenario
    const scenarioConfig = Scenarios[scenario];
    if (!scenarioConfig) {
      throw new Error(`Escenario desconocido: ${scenario}. Disponibles: ${Object.keys(Scenarios).join(', ')}`);
    }
    
    // Paso 3: Crear/obtener usuario QA
    console.log(ASCII.section('👤 USUARIO QA'));
    const qaUserId = await getOrCreateQAUser(client);
    
    // Paso 4: Insertar datos según escenario
    const tractors = await insertTractors(client, scenarioConfig.tractors);
    const terrains = await insertTerrains(client, scenarioConfig.terrains, qaUserId);
    const implementsList = await insertImplements(client, scenarioConfig.implements);
    
    await client.query('COMMIT');
    
    // Paso 5: Resumen
    console.log(ASCII.section('📊 RESUMEN'));
    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                     📋 DATOS INSERTADOS - ESCENARIO: ${scenario.toUpperCase().padEnd(23)}║
╠════════════════════════════════════════════════════════════════════════════╣
║  Usuario QA    : ID ${String(qaUserId).padEnd(56)}║
║  Tractores     : ${String(tractors.length).padEnd(59)}║
║  Terrenos      : ${String(terrains.length).padEnd(59)}║
║  Implementos   : ${String(implementsList.length).padEnd(59)}║
╠════════════════════════════════════════════════════════════════════════════╣
║  Credenciales  : ${CONFIG.QA_USER_EMAIL.padEnd(35)} / ${CONFIG.DEFAULT_PASSWORD.padEnd(15)}║
╚════════════════════════════════════════════════════════════════════════════╝
    `);
    
    // IDs para Postman
    const flatTerrain = terrains.find(t => t.slope_percentage < 5);
    const steepTerrain = terrains.find(t => t.slope_percentage > 15);
    const lightImplement = implementsList.find(i => i.power_requirement_hp <= 30);
    const heavyImplement = implementsList.find(i => i.power_requirement_hp >= 50);
    
    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                     🧪 IDS PARA POSTMAN ENVIRONMENT                        ║
╠════════════════════════════════════════════════════════════════════════════╣
║  terrainIdPlano    : ${String(flatTerrain?.id || 'N/A').padEnd(55)}║
║  terrainIdMontana  : ${String(steepTerrain?.id || 'N/A').padEnd(55)}║
║  implementIdLigero : ${String(lightImplement?.id || 'N/A').padEnd(55)}║
║  implementIdPesado : ${String(heavyImplement?.id || 'N/A').padEnd(55)}║
╚════════════════════════════════════════════════════════════════════════════╝
    `);
    
    return {
      qaUserId,
      tractors,
      terrains,
      implements: implementsList,
      postmanIds: {
        terrainIdPlano: flatTerrain?.id,
        terrainIdMontana: steepTerrain?.id,
        implementIdLigero: lightImplement?.id,
        implementIdPesado: heavyImplement?.id,
      },
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`\n${ASCII.error} Error en seed:`, error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// CLI

// Parsear argumentos de línea de comandos
const args = process.argv.slice(2);
const options = {
  clean: args.includes('--clean'),
  scenario: 'qa',
};

// Buscar --scenario=<valor>
const scenarioArg = args.find(arg => arg.startsWith('--scenario='));
if (scenarioArg) {
  options.scenario = scenarioArg.split('=')[1];
}

// Mostrar ayuda si se solicita
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Uso: node src/scripts/seed-unified.js [opciones]

Opciones:
  --clean              Limpia duplicados antes de insertar
  --scenario=<nombre>  Escenario de prueba a usar

Escenarios disponibles:
  basic      Mínimo para desarrollo (1 tractor, 1 terreno, 1 implemento)
  qa         Pruebas completas de QA (Regla de Oro, Eficiencia, etc.)
  full       Todos los tipos de datos disponibles
  efficiency Pruebas de sobredimensionamiento
  montana    Pruebas de Regla de Oro (pendientes > 15%)

Ejemplos:
  node src/scripts/seed-unified.js --clean --scenario=qa
  node src/scripts/seed-unified.js --scenario=full
  `);
  process.exit(0);
}

// Ejecutar
seedUnified(options)
  .then(() => {
    console.log(`\n${ASCII.ok} Seed completado exitosamente`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`${ASCII.error} Seed falló:`, error);
    process.exit(1);
  });

export { seedUnified, DataGenerator, Scenarios, cleanDuplicates };
