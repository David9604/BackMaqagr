# Optimización de Base de Datos - Sistema Agrícola

## Índices Implementados

Este documento describe los índices de base de datos creados para optimizar las consultas más frecuentes del sistema.

### Resumen de Índices

| Índice | Tabla | Columna(s) | Caso de Uso |
|--------|-------|------------|-------------|
| `idx_users_email_unique` | `users` | `LOWER(email)` | Login / búsqueda por email |
| `idx_tractor_power` | `tractor` | `engine_power_hp` | Filtro de recomendaciones por potencia |
| `idx_terrain_user_id` | `terrain` | `user_id` | Listado de terrenos por usuario |
| `idx_query_user_id` | `query` | `user_id` | Historial de consultas por usuario |
| `idx_recommendation_tractor_date` | `recommendation` | `(tractor_id, recommendation_date)` | Top recomendaciones por tractor |
| `idx_recommendation_user_id` | `recommendation` | `user_id` | Historial de recomendaciones |
| `idx_recommendation_terrain_id` | `recommendation` | `terrain_id` | Recomendaciones por terreno |
| `idx_terrain_user_status` | `terrain` | `(user_id, status)` | Terrenos activos del usuario |
| `idx_query_history_user_id` | `query_history` | `user_id` | Historial de acciones del usuario |
| `idx_tractor_traction_type` | `tractor` | `traction_type` | Filtro Golden Rule (4WD en pendientes) |

### Impacto Esperado

#### 1. `users.email` - Búsquedas de Login
- **Antes**: Escaneo secuencial completo (`Seq Scan`) en cada login
- **Después**: Búsqueda por índice B-Tree ($O(\log n)$)
- **Consultas beneficiadas**: `User.findByEmail()`, validación de duplicados en registro
- **Impacto**: Alto — se ejecuta en cada autenticación

#### 2. `tractor.engine_power_hp` - Filtros de Recomendación
- **Antes**: Escaneo completo de tabla `tractor` para filtrar por potencia
- **Después**: Búsqueda por rango en índice B-Tree
- **Consultas beneficiadas**: `Tractor.searchByPowerRange()`, `findCompatibleTractors()`
- **Impacto**: Medio — crece con el catálogo de tractores

#### 3. `terrain.user_id` - Terrenos por Usuario
- **Antes**: Escaneo completo de `terrain` filtrando por `user_id`
- **Después**: Acceso directo por índice
- **Consultas beneficiadas**: `Terrain.findByUserId()`, `Terrain.findByIdAndUser()`
- **Impacto**: Alto — cada usuario solo ve sus terrenos

#### 4. `query.user_id` - Historial de Consultas
- **Antes**: Escaneo completo para filtrar queries del usuario
- **Después**: Acceso indexado
- **Consultas beneficiadas**: `Query.findByUser()`, `Query.getRecent()`
- **Impacto**: Alto — tabla crece con cada recomendación generada

#### 5. `recommendation(tractor_id, recommendation_date)` - Índice Compuesto
- **Antes**: Sort en memoria para ordenar por fecha dentro de un tractor
- **Después**: Datos pre-ordenados en el índice
- **Consultas beneficiadas**: `Recommendation.getTopRecommendations()`, consultas analíticas
- **Impacto**: Medio-Alto — evita sorts costosos

### Aplicación de Índices

```bash
# Aplicar índices en la base de datos de producción
psql -U <usuario> -d <base_de_datos> -f database/indexes.sql

# Aplicar en base de datos de desarrollo
psql -U postgres -d MaqAgr -f database/indexes.sql
```

### Verificación

Para verificar que los índices se crearon correctamente:

```sql
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

Para analizar el impacto de un índice en una consulta específica:

```sql
EXPLAIN ANALYZE SELECT * FROM users WHERE LOWER(email) = 'test@example.com';
EXPLAIN ANALYZE SELECT * FROM terrain WHERE user_id = 1 AND status = 'active';
EXPLAIN ANALYZE SELECT * FROM tractor WHERE engine_power_hp >= 50 AND engine_power_hp <= 100;
```

### Notas Importantes

- Los índices usan `CREATE INDEX IF NOT EXISTS` para que el script sea **idempotente** (puede ejecutarse múltiples veces sin error).
- Algunos índices ya existen en `schema.sql` (como `idx_users_email`). Los nuevos índices complementan o mejoran los existentes.
- El índice funcional `LOWER(email)` asegura que las búsquedas case-insensitive usen el índice correctamente.
- El índice compuesto `(tractor_id, recommendation_date DESC)` está optimizado para consultas que ordenan por fecha descendente.

### Mantenimiento

Los índices requieren mantenimiento periódico:

```sql
-- Reindexar una tabla específica
REINDEX TABLE users;

-- Analizar estadísticas (necesario después de cambios masivos de datos)
ANALYZE users;
ANALYZE tractor;
ANALYZE terrain;
ANALYZE recommendation;
```
