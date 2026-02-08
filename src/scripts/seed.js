/**
 * @deprecated Este script ha sido reemplazado por seed-unified.js
 * 
 * Uso del nuevo script:
 *   node src/scripts/seed-unified.js --scenario=basic   # Datos mínimos
 *   node src/scripts/seed-unified.js --scenario=qa      # Datos para QA
 *   node src/scripts/seed-unified.js --scenario=full    # Todos los datos
 *   node src/scripts/seed-unified.js --clean            # Limpia duplicados
 * 
 * Para ver todas las opciones:
 *   node src/scripts/seed-unified.js --help
 */

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║  ⚠️  SCRIPT DEPRECADO                                                       ║
║                                                                            ║
║  Este script ha sido reemplazado por seed-unified.js                       ║
║  Por favor usa el nuevo sistema unificado de seed.                         ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  Uso:                                                                      ║
║    node src/scripts/seed-unified.js --scenario=basic   # Datos mínimos    ║
║    node src/scripts/seed-unified.js --scenario=qa      # Datos para QA    ║
║    node src/scripts/seed-unified.js --scenario=full    # Todos los datos  ║
║    node src/scripts/seed-unified.js --clean            # Limpia duplicados ║
║                                                                            ║
║  Para ver todas las opciones:                                              ║
║    node src/scripts/seed-unified.js --help                                 ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

// Ejecutar el nuevo script con escenario básico
import { seedUnified } from './seed-unified.js';

seedUnified({ scenario: 'basic' })
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
