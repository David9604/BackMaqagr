-- ============================================
-- ÍNDICES DE OPTIMIZACIÓN - SISTEMA AGRÍCOLA
-- ============================================
-- Script de creación de índices para optimizar consultas frecuentes.
-- Estos índices complementan los ya existentes en schema.sql.
--
-- Ejecutar con:
--   psql -U <usuario> -d <base_de_datos> -f database/indexes.sql
--
-- NOTA: Usar CREATE INDEX IF NOT EXISTS para idempotencia.
-- ============================================

-- ============================================
-- ÍNDICE: users.email
-- Uso: Búsquedas de login (findByEmail)
-- Impacto: O(n) → O(log n) en autenticación
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email_unique
  ON users (LOWER(email));

-- ============================================
-- ÍNDICE: tractor.engine_power_hp
-- Uso: Filtros de recomendación por potencia
-- Impacto: Acelera findCompatibleTractors() y searchByPowerRange()
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tractor_power
  ON tractor (engine_power_hp);

-- ============================================
-- ÍNDICE: terrain.user_id
-- Uso: Consultas de terrenos por usuario (findByUserId)
-- Impacto: O(n) → O(log n) en listado de terrenos del usuario
-- ============================================
CREATE INDEX IF NOT EXISTS idx_terrain_user_id
  ON terrain (user_id);

-- ============================================
-- ÍNDICE: query.user_id
-- Uso: Historial de consultas por usuario (findByUser)
-- Impacto: Acelera consultas al historial del usuario
-- ============================================
CREATE INDEX IF NOT EXISTS idx_query_user_id
  ON query (user_id);

-- ============================================
-- ÍNDICE COMPUESTO: recommendation(tractor_id, recommendation_date)
-- Uso: Consultas de recomendaciones por tractor ordenadas por fecha
-- Impacto: Optimiza getTopRecommendations() y consultas analíticas
-- ============================================
CREATE INDEX IF NOT EXISTS idx_recommendation_tractor_date
  ON recommendation (tractor_id, recommendation_date DESC);

-- ============================================
-- ÍNDICE: recommendation.user_id
-- Uso: Historial de recomendaciones por usuario
-- Impacto: Acelera getRecommendationHistory()
-- ============================================
CREATE INDEX IF NOT EXISTS idx_recommendation_user_id
  ON recommendation (user_id);

-- ============================================
-- ÍNDICE: recommendation.terrain_id
-- Uso: Recomendaciones por terreno
-- Impacto: Acelera findByTerrain()
-- ============================================
CREATE INDEX IF NOT EXISTS idx_recommendation_terrain_id
  ON recommendation (terrain_id);

-- ============================================
-- ÍNDICE COMPUESTO: terrain(user_id, status)
-- Uso: Consultas de terrenos activos del usuario
-- Impacto: Cubre findByIdAndUser() con filtro de status
-- ============================================
CREATE INDEX IF NOT EXISTS idx_terrain_user_status
  ON terrain (user_id, status);

-- ============================================
-- ÍNDICE: query_history.user_id
-- Uso: Historial de acciones por usuario
-- Impacto: Acelera findByUser() en QueryHistory
-- ============================================
CREATE INDEX IF NOT EXISTS idx_query_history_user_id
  ON query_history (user_id);

-- ============================================
-- ÍNDICE: tractor.traction_type
-- Uso: Filtro "Golden Rule" en recomendaciones (4WD para pendientes >15%)
-- Impacto: Acelera filtros de tipo de tracción
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tractor_traction_type
  ON tractor (traction_type);

-- ============================================
-- VERIFICACIÓN DE ÍNDICES CREADOS
-- ============================================
-- Para verificar los índices ejecutar:
--   SELECT indexname, tablename, indexdef 
--   FROM pg_indexes 
--   WHERE schemaname = 'public' 
--   ORDER BY tablename, indexname;
