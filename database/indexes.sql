-- ============================================
-- DATABASE OPTIMIZATION INDEXES
-- ============================================

-- 1. Users & Authentication
-- Optimize login by email
CREATE INDEX IF NOT EXISTS idx_users_email_search ON users(email);

-- 2. Recommendations & Tractors
-- Optimize tractor filtering by power (frequent in recommendations)
CREATE INDEX IF NOT EXISTS idx_tractor_power ON tractor(engine_power_hp);

-- 3. Terrains
-- Optimize terrain retrieval by user (frequent in dashboard)
CREATE INDEX IF NOT EXISTS idx_terrain_user_id ON terrain(user_id);

-- 4. Query History
-- Optimize history retrieval by user
CREATE INDEX IF NOT EXISTS idx_query_history_user_id ON query_history(user_id);

-- 5. Recommendations (Composite)
-- Optimize checking existing recommendations for specific tractor
CREATE INDEX IF NOT EXISTS idx_recommendation_tractor_created ON recommendation(tractor_id, recommendation_date);

-- ============================================
-- USAGE
-- Execute this script in your PostgreSQL database:
-- psql -U <user> -d <database> -f database/indexes.sql
-- ============================================
