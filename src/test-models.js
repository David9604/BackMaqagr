import dotenv from 'dotenv';
import { pool } from './config/db.js';
import Role from './models/Role.js';
import Tractor from './models/Tractor.js';

dotenv.config();

// Quick test
async function quickTest() {
  try {
    console.log('🔍 Quick connection test...\n');

    // Test 1: Database connection
    const dbResult = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', dbResult.rows[0].now);

    // Test 2: Get roles (simple query)
    const roles = await Role.getAll();
    console.log(`✅ Found ${roles.length} roles:`, roles.map(r => r.role_name).join(', '));

    // Test 3: Get tractors count
    const tractors = await Tractor.getAll();
    console.log(`✅ Found ${tractors.length} tractors`);

    console.log('\n✨ Connection test passed!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
    console.log('🔌 Connection closed');
  }
}

quickTest();
