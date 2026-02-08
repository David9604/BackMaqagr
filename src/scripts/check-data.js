import { pool } from '../config/db.js';

/**
 * Verifica y muestra los datos disponibles en la base de datos
 * Consulta tractores y terrenos para validar la conexión
 */
async function checkData() {
  try {
    // Obtener los primeros 5 tractores de la base de datos
    const tractors = await pool.query('SELECT tractor_id, brand, model FROM tractor LIMIT 5');
    const terrains = await pool.query('SELECT terrain_id, name FROM terrain LIMIT 5');
    
    // Mostrar tractores disponibles
    console.log('\n[T] Tractores disponibles:');
    tractors.rows.forEach(t => console.log(`   ID: ${t.tractor_id} - ${t.brand} ${t.model}`));
    
    // Mostrar terrenos disponibles
    console.log('\n[*] Terrenos disponibles:');
    terrains.rows.forEach(t => console.log(`   ID: ${t.terrain_id} - ${t.name}`));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    // Cerrar la conexión a la base de datos
    await pool.end();
  }
}

checkData();
