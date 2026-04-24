-- Migration: 000_initial_schema.sql
-- Creates all base tables for the BackMaqagr application
-- This is the foundational migration - run this first on a fresh database

-- ============================================
-- ROLES
-- ============================================
CREATE TABLE IF NOT EXISTS role (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- USERS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES role(role_id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active',
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_session TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- ============================================
-- TRACTORS
-- ============================================
CREATE TABLE IF NOT EXISTS tractor (
    tractor_id SERIAL PRIMARY KEY,
    name VARCHAR(150),
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    model_year INTEGER,
    engine_power_hp DOUBLE PRECISION NOT NULL,
    price DOUBLE PRECISION,
    weight_kg DOUBLE PRECISION,
    traction_force_kn DOUBLE PRECISION,
    traction_type VARCHAR(20) NOT NULL,
    tire_type VARCHAR(50),
    tire_width_mm DOUBLE PRECISION,
    tire_diameter_mm DOUBLE PRECISION,
    tire_pressure_psi DOUBLE PRECISION,
    price_usd DOUBLE PRECISION,
    fuel_consumption_lph DOUBLE PRECISION,
    maintenance_cost_per_hour DOUBLE PRECISION,
    status VARCHAR(20) DEFAULT 'available',
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    image_url TEXT,
    CONSTRAINT tractor_model_year_valid CHECK (model_year IS NULL OR model_year BETWEEN 1900 AND 2100),
    CONSTRAINT tractor_price_valid CHECK (price IS NULL OR price > 0),
    CONSTRAINT tractor_image_url_valid CHECK (image_url IS NULL OR image_url ~* '^https?://')
);

-- ============================================
-- IMPLEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS implement (
    implement_id SERIAL PRIMARY KEY,
    implement_name VARCHAR(150) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    power_requirement_hp DOUBLE PRECISION NOT NULL,
    working_width_m DOUBLE PRECISION,
    soil_type VARCHAR(50),
    working_depth_cm DOUBLE PRECISION,
    weight_kg DOUBLE PRECISION,
    implement_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'available',
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    image_url TEXT,
    CONSTRAINT implement_image_url_valid CHECK (image_url IS NULL OR image_url ~* '^https?://')
);

-- ============================================
-- TERRAINS
-- ============================================
CREATE TABLE IF NOT EXISTS terrain (
    terrain_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    area_hectares DOUBLE PRECISION,
    altitude_meters DOUBLE PRECISION,
    slope_percentage DOUBLE PRECISION,
    soil_type VARCHAR(50),
    temperature_celsius DOUBLE PRECISION,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_terrain_user_id ON terrain(user_id);

-- ============================================
-- QUERIES
-- ============================================
CREATE TABLE IF NOT EXISTS query (
    query_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    terrain_id INTEGER REFERENCES terrain(terrain_id) ON DELETE CASCADE,
    tractor_id INTEGER REFERENCES tractor(tractor_id) ON DELETE SET NULL,
    implement_id INTEGER REFERENCES implement(implement_id) ON DELETE SET NULL,
    pto_distance_m DOUBLE PRECISION,
    carried_objects_weight_kg DOUBLE PRECISION DEFAULT 0,
    working_speed_kmh DOUBLE PRECISION,
    query_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'completed',
    query_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_query_user_id ON query(user_id);
CREATE INDEX IF NOT EXISTS idx_query_terrain_id ON query(terrain_id);

-- ============================================
-- POWER LOSS
-- ============================================
CREATE TABLE IF NOT EXISTS power_loss (
    power_loss_id SERIAL PRIMARY KEY,
    query_id INTEGER REFERENCES query(query_id) ON DELETE CASCADE,
    slope_loss_hp DOUBLE PRECISION,
    altitude_loss_hp DOUBLE PRECISION,
    rolling_resistance_loss_hp DOUBLE PRECISION,
    slippage_loss_hp DOUBLE PRECISION,
    total_loss_hp DOUBLE PRECISION,
    available_power_hp DOUBLE PRECISION,
    net_power_hp DOUBLE PRECISION,
    efficiency_percentage DOUBLE PRECISION,
    calculation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- RECOMMENDATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS recommendation (
    recommendation_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    terrain_id INTEGER REFERENCES terrain(terrain_id) ON DELETE CASCADE,
    tractor_id INTEGER REFERENCES tractor(tractor_id) ON DELETE SET NULL,
    implement_id INTEGER REFERENCES implement(implement_id) ON DELETE SET NULL,
    compatibility_score DOUBLE PRECISION,
    observations TEXT,
    work_type VARCHAR(100),
    recommendation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recommendation_user_id ON recommendation(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_terrain_id ON recommendation(terrain_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notification (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_user_id ON notification(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_read ON notification(user_id, read);

-- ============================================
-- QUERY HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS query_history (
    history_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    query_id INTEGER REFERENCES query(query_id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,
    description TEXT,
    result_json JSONB,
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_query_history_user_id ON query_history(user_id);
CREATE INDEX IF NOT EXISTS idx_query_history_query_id ON query_history(query_id);

-- ============================================
-- SEED: Default roles
-- ============================================
INSERT INTO role (role_name, description, status) VALUES
    ('admin', 'Administrador del sistema con acceso completo', 'active'),
    ('user', 'Usuario regular con acceso limitado', 'active')
ON CONFLICT (role_name) DO NOTHING;