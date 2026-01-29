import { pool } from '../config/db.js';

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('[~] Iniciando seed de la base de datos...\n');
    
    // Insertar terrains de prueba
    console.log('[*] Insertando terrenos...');
    await client.query(`
      INSERT INTO terrain (name, altitude_meters, slope_percentage, soil_type, temperature_celsius) 
      VALUES 
        ('Finca Valle Verde', 800, 5, 'Franco', 22),
        ('Lote Montaña Alta', 2200, 12, 'Arcilla', 18),
        ('Terreno Plano Costa', 50, 2, 'Arena', 28)
      ON CONFLICT DO NOTHING
    `);
    
    // Insertar tractors de prueba
    console.log('[T] Insertando tractores...');
    await client.query(`
      INSERT INTO tractor (name, brand, model, engine_power_hp, weight_kg, traction_force_kn, traction_type, tire_type) 
      VALUES 
        ('John Deere 5075E', 'John Deere', '5075E', 75, 3200, 45, '4x4', 'Radial 16.9R30'),
        ('Massey Ferguson 4709', 'Massey Ferguson', '4709', 90, 3500, 52, '4x4', 'Radial 18.4R34'),
        ('New Holland TT3.55', 'New Holland', 'TT3.55', 55, 2800, 38, '4x2', 'Diagonal 14.9-28')
      ON CONFLICT DO NOTHING
    `);
    
    // Verificar que se insertaron
    const terrainCount = await client.query('SELECT COUNT(*) FROM terrain');
    const tractorCount = await client.query('SELECT COUNT(*) FROM tractor');
    
    console.log(`\n[+] Seed completado:`);
    console.log(`   - Terrenos: ${terrainCount.rows[0].count}`);
    console.log(`   - Tractores: ${tractorCount.rows[0].count}`);
    
  } catch (error) {
    console.error('[X] Error en seed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();
