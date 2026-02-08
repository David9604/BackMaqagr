-- ============================================
-- COMPLETE SCHEMA - AGRICULTURAL MANAGEMENT SYSTEM
-- Database for tractor and implement power calculations
-- ============================================

-- Drop tables if they exist (for development)
DROP TABLE IF EXISTS query_history CASCADE;
DROP TABLE IF EXISTS power_loss CASCADE;
DROP TABLE IF EXISTS recommendation CASCADE;
DROP TABLE IF EXISTS query CASCADE;
DROP TABLE IF EXISTS implement CASCADE;
DROP TABLE IF EXISTS tractor CASCADE;
DROP TABLE IF EXISTS terrain CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS role CASCADE;

-- ============================================
-- TABLE: role
-- User roles catalog
-- ============================================
CREATE TABLE role (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- ============================================
-- TABLE: users
-- System users management
-- ============================================
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL REFERENCES role(role_id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_session TIMESTAMP
);



-- ============================================
-- TABLE: terrain
-- Agricultural terrain information
-- ============================================
CREATE TABLE terrain (
    terrain_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    altitude_meters DOUBLE PRECISION NOT NULL,
    slope_percentage DOUBLE PRECISION NOT NULL,
    soil_type VARCHAR(100) NOT NULL,
    temperature_celsius DOUBLE PRECISION,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'
);

-- ============================================
-- TABLE: tractor
-- Available tractors catalog
-- ============================================
CREATE TABLE tractor (
    tractor_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    engine_power_hp DOUBLE PRECISION NOT NULL,
    weight_kg DOUBLE PRECISION NOT NULL,
    traction_force_kn DOUBLE PRECISION NOT NULL,
    traction_type VARCHAR(50) NOT NULL CHECK (traction_type IN ('4x2', '4x4', 'track')),
    tire_type VARCHAR(100),
    tire_width_mm DOUBLE PRECISION,
    tire_diameter_mm DOUBLE PRECISION,
    tire_pressure_psi DOUBLE PRECISION,
    status VARCHAR(20) DEFAULT 'available',
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: implement
-- Agricultural implements catalog
-- ============================================
CREATE TABLE implement (
    implement_id SERIAL PRIMARY KEY,
    implement_name VARCHAR(150) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    power_requirement_hp DOUBLE PRECISION NOT NULL,
    working_width_m DOUBLE PRECISION NOT NULL,
    soil_type VARCHAR(100),
    working_depth_cm DOUBLE PRECISION,
    weight_kg DOUBLE PRECISION,
    implement_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'available',
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: query
-- Power calculation queries registry
-- ============================================
CREATE TABLE query (
    query_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    terrain_id INTEGER NOT NULL REFERENCES terrain(terrain_id) ON DELETE CASCADE,
    tractor_id INTEGER NOT NULL REFERENCES tractor(tractor_id) ON DELETE CASCADE,
    implement_id INTEGER REFERENCES implement(implement_id) ON DELETE SET NULL,
    pto_distance_m DOUBLE PRECISION,
    carried_objects_weight_kg DOUBLE PRECISION DEFAULT 0,
    working_speed_kmh DOUBLE PRECISION,
    query_type VARCHAR(50) NOT NULL CHECK (query_type IN ('power_loss', 'minimum_power', 'recommendation')),
    query_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'completed'
);

-- ============================================
-- TABLE: power_loss
-- Power loss calculation results
-- ============================================
CREATE TABLE power_loss (
    power_loss_id SERIAL PRIMARY KEY,
    query_id INTEGER NOT NULL REFERENCES query(query_id) ON DELETE CASCADE,
    slope_loss_hp DOUBLE PRECISION,
    altitude_loss_hp DOUBLE PRECISION,
    rolling_resistance_loss_hp DOUBLE PRECISION,
    slippage_loss_hp DOUBLE PRECISION,
    total_loss_hp DOUBLE PRECISION NOT NULL,
    available_power_hp DOUBLE PRECISION NOT NULL,
    net_power_hp DOUBLE PRECISION NOT NULL,
    efficiency_percentage DOUBLE PRECISION,
    calculation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: recommendation
-- Tractor and implement recommendation system
-- ============================================
CREATE TABLE recommendation (
    recommendation_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    terrain_id INTEGER NOT NULL REFERENCES terrain(terrain_id) ON DELETE CASCADE,
    tractor_id INTEGER REFERENCES tractor(tractor_id) ON DELETE SET NULL,
    implement_id INTEGER REFERENCES implement(implement_id) ON DELETE SET NULL,
    compatibility_score DOUBLE PRECISION,
    observations TEXT,
    work_type VARCHAR(100),
    recommendation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: query_history
-- Historical record of all user queries
-- ============================================
CREATE TABLE query_history (
    history_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    query_id INTEGER REFERENCES query(query_id) ON DELETE SET NULL,
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action_type VARCHAR(50) NOT NULL,
    description TEXT,
    result_json JSONB
);

-- ============================================
-- INDEXES FOR OPTIMIZATION
-- ============================================

-- Indexes for frequent searches
CREATE INDEX idx_role_name ON role(role_name);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role_id);

CREATE INDEX idx_terrain_soil_type ON terrain(soil_type);
CREATE INDEX idx_terrain_status ON terrain(status);

CREATE INDEX idx_tractor_brand_model ON tractor(brand, model);
CREATE INDEX idx_tractor_status ON tractor(status);

CREATE INDEX idx_implement_type ON implement(implement_type);
CREATE INDEX idx_implement_status ON implement(status);

CREATE INDEX idx_query_user ON query(user_id);
CREATE INDEX idx_query_date ON query(query_date);
CREATE INDEX idx_query_type ON query(query_type);

CREATE INDEX idx_history_user ON query_history(user_id);
CREATE INDEX idx_history_date ON query_history(action_date);

-- ============================================
-- TEST DATA (OPTIONAL)
-- ============================================

-- Insert roles
INSERT INTO role (role_name, description) VALUES
('admin', 'System administrator with all permissions'),
('user', 'Standard user with basic permissions'),
('operator', 'Operator with query and calculation permissions');

-- Insert test users
INSERT INTO users (name, email, password, role_id, status) VALUES
('Administrator', 'admin@maqagr.com', '$2b$10$sample_hash_bcrypt', 1, 'active'),
('Demo User', 'demo@maqagr.com', '$2b$10$sample_hash_bcrypt', 2, 'active');

-- Insert sample tractors
INSERT INTO tractor (name, brand, model, engine_power_hp, weight_kg, traction_force_kn, traction_type, tire_type, status) VALUES
('John Deere 5075E', 'John Deere', '5075E', 75, 3200, 45, '4x4', 'Radial 16.9R30', 'available'),
('Massey Ferguson 4709', 'Massey Ferguson', '4709', 90, 3500, 52, '4x4', 'Radial 18.4R34', 'available'),
('New Holland TT3.55', 'New Holland', 'TT3.55', 55, 2800, 38, '4x2', 'Diagonal 14.9-28', 'available');

-- Insert sample implements
INSERT INTO implement (implement_name, brand, power_requirement_hp, working_width_m, soil_type, implement_type, status) VALUES
('3-body disc plow', 'Baldan', 50, 0.9, 'Loam', 'plow', 'available'),
('20-disc harrow', 'Tatu', 35, 1.8, 'All', 'harrow', 'available'),
('5-row seeder', 'Semeato', 40, 1.5, 'Loam', 'seeder', 'available');

-- ============================================
-- FINAL NOTES
-- ============================================
-- This schema is designed for PostgreSQL
-- Execute with: psql -U user -d database_name -f schema.sql
-- Make sure the database is created before executing
