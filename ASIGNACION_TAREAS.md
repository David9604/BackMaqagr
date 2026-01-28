# 📋 Asignación de Tareas - Backend MaqAgr

## 🎯 Estado Actual del Proyecto

✅ **Completado:**
- Base de datos PostgreSQL configurada (9 tablas)
- Modelos creados y probados (User, Role, Tractor, Implement, Terrain, Query, PowerLoss, Recommendation, QueryHistory)
- Archivo .env configurado
- Conexión a base de datos funcionando

⏳ **Pendiente:**
- Controladores (Controllers)
- Rutas (Routes)
- Middleware de autenticación y validación
- Servicios de cálculo (fórmulas matemáticas)

---

## 👥 Distribución de Tareas por Persona

### 🟦 Julian Medina Monje - Módulo de Autenticación y Usuarios

**Responsabilidad:** Sistema de autenticación, gestión de usuarios y roles

#### Tareas:

**1. Crear Middleware de Autenticación**
- **Archivo:** `src/middleware/auth.middleware.js`
- Función `verifyToken(req, res, next)` - Verificar JWT en headers
- Función `isAdmin(req, res, next)` - Verificar si el usuario es admin
- Función `isAuthenticated(req, res, next)` - Verificar si hay sesión activa

**2. Crear Utilidad JWT**
- **Archivo:** `src/utils/jwt.util.js`
- Función `generateToken(payload)` - Generar tokens JWT
- Función `verifyToken(token)` - Verificar y decodificar tokens
- Función `refreshToken(token)` - Refrescar tokens expirados

**3. Crear Controlador de Autenticación**
- **Archivo:** `src/controllers/authController.js`
- `register(req, res)` - Registrar nuevo usuario (con bcrypt)
- `login(req, res)` - Login y generación de JWT
- `logout(req, res)` - Cerrar sesión
- `getProfile(req, res)` - Obtener perfil del usuario autenticado
- `updateProfile(req, res)` - Actualizar datos del usuario
- `changePassword(req, res)` - Cambiar contraseña

**4. Crear Rutas de Autenticación**
- **Archivo:** `src/routes/auth.routes.js`
```javascript
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/profile      (requiere autenticación)
PUT    /api/auth/profile      (requiere autenticación)
PUT    /api/auth/password     (requiere autenticación)
```

**5. Crear Controlador de Roles**
- **Archivo:** `src/controllers/roleController.js`
- `getAllRoles(req, res)` - Listar todos los roles
- `createRole(req, res)` - Crear nuevo rol (solo admin)
- `updateRole(req, res)` - Actualizar rol (solo admin)
- `deleteRole(req, res)` - Eliminar rol (solo admin)

**6. Crear Rutas de Roles**
- **Archivo:** `src/routes/role.routes.js`
```javascript
GET    /api/roles             (requiere autenticación)
POST   /api/roles             (requiere admin)
PUT    /api/roles/:id         (requiere admin)
DELETE /api/roles/:id         (requiere admin)
```

**Notas importantes:**
- Usar `bcrypt` para hashear contraseñas (ya instalado)
- Usar `jsonwebtoken` para JWT (ya instalado)
- Validar formato de email y contraseña fuerte
- Hashear contraseñas antes de guardar en BD

**Tiempo estimado:** 8-10 horas

---

### 🟩 Juan Esteban Rojas - Módulo de Tractores e Implementos

**Responsabilidad:** CRUD de tractores e implementos agrícolas

#### Tareas:

**1. Crear Controlador de Tractores**
- **Archivo:** `src/controllers/tractorController.js`
- `getAllTractors(req, res)` - Listar todos los tractores
- `getTractorById(req, res)` - Obtener un tractor por ID
- `createTractor(req, res)` - Crear nuevo tractor (requiere admin)
- `updateTractor(req, res)` - Actualizar tractor (requiere admin)
- `deleteTractor(req, res)` - Eliminar tractor (requiere admin)
- `searchTractors(req, res)` - Buscar por marca, modelo o potencia
- `getAvailableTractors(req, res)` - Obtener tractores disponibles

**2. Crear Rutas de Tractores**
- **Archivo:** `src/routes/tractor.routes.js`
```javascript
GET    /api/tractors
GET    /api/tractors/available
GET    /api/tractors/search?brand=...&minPower=...&maxPower=...
GET    /api/tractors/:id
POST   /api/tractors          (requiere admin)
PUT    /api/tractors/:id      (requiere admin)
DELETE /api/tractors/:id      (requiere admin)
```

**3. Crear Controlador de Implementos**
- **Archivo:** `src/controllers/implementController.js`
- `getAllImplements(req, res)` - Listar todos los implementos
- `getImplementById(req, res)` - Obtener un implemento por ID
- `createImplement(req, res)` - Crear nuevo implemento (requiere admin)
- `updateImplement(req, res)` - Actualizar implemento (requiere admin)
- `deleteImplement(req, res)` - Eliminar implemento (requiere admin)
- `searchImplements(req, res)` - Buscar por tipo o potencia requerida
- `getAvailableImplements(req, res)` - Obtener implementos disponibles

**4. Crear Rutas de Implementos**
- **Archivo:** `src/routes/implement.routes.js`
```javascript
GET    /api/implements
GET    /api/implements/available
GET    /api/implements/search?type=...&soilType=...&maxPower=...
GET    /api/implements/:id
POST   /api/implements        (requiere admin)
PUT    /api/implements/:id    (requiere admin)
DELETE /api/implements/:id    (requiere admin)
```

**5. Crear Middleware de Validación**
- **Archivo:** `src/middleware/validation.middleware.js`
- `validateTractor(req, res, next)` - Validar datos de tractor
- `validateImplement(req, res, next)` - Validar datos de implemento
- Validaciones:
  - Campos requeridos presentes
  - Tipos de datos correctos
  - Valores numéricos positivos
  - Valores de enums válidos (traction_type, status, etc.)

**6. Crear Controlador de Terrenos**
- **Archivo:** `src/controllers/terrainController.js`
- `getAllTerrains(req, res)` - Listar terrenos
- `getTerrainById(req, res)` - Obtener terreno por ID
- `createTerrain(req, res)` - Crear terreno
- `updateTerrain(req, res)` - Actualizar terreno
- `deleteTerrain(req, res)` - Eliminar terreno

**7. Crear Rutas de Terrenos**
- **Archivo:** `src/routes/terrain.routes.js`
```javascript
GET    /api/terrains
GET    /api/terrains/:id
POST   /api/terrains          (requiere autenticación)
PUT    /api/terrains/:id      (requiere autenticación)
DELETE /api/terrains/:id      (requiere autenticación)
```

**Notas importantes:**
- Implementar paginación en las listas (limit, offset)
- Agregar filtros de búsqueda
- Validar que los valores numéricos sean positivos
- Manejar errores 404 cuando no se encuentra un recurso

**Tiempo estimado:** 10-12 horas

---

### 🟨 Brayan Toro - Módulo de Cálculos y Recomendaciones (CORE)

**Responsabilidad:** Sistema de cálculos de potencia y recomendaciones

#### Tareas:

**1. Crear Servicio de Pérdida de Potencia**
- **Archivo:** `src/services/powerLossService.js`
- **Fórmulas a implementar:**

```javascript
// Pérdida por pendiente
calculateSlopeLoss(weight_kg, speed_kmh, slope_percentage)
// Fórmula: (peso_total * velocidad * pendiente) / 273

// Pérdida por altitud
calculateAltitudeLoss(engine_power_hp, altitude_meters)
// Fórmula: potencia_motor * (0.03 * (altitud / 300))

// Pérdida por resistencia a la rodadura
calculateRollingResistanceLoss(weight_kg, rolling_coefficient, speed_kmh)
// Fórmula: (peso_total * coef_rodadura * velocidad) / 273

// Pérdida por patinaje
calculateSlippageLoss(traction_type, soil_type, engine_power_hp)
// Fórmula: potencia_motor * (patinaje / 100)
// Patinaje según tracción: 4x4 = 8%, 4x2 = 15%, track = 5%

// Cálculo total
calculateTotalLoss(tractorData, terrainData, operationData)
// Retorna objeto con todas las pérdidas y potencia neta
```

**2. Crear Servicio de Potencia Mínima**
- **Archivo:** `src/services/minimumPowerService.js`
- Función `calculateMinimumPower(implementData, terrainData)`
- Considera:
  - Potencia requerida del implemento
  - Tipo de suelo (factor de resistencia)
  - Ancho de trabajo
  - Profundidad de trabajo
  - Pendiente del terreno

**3. Crear Servicio de Recomendación**
- **Archivo:** `src/services/recommendationService.js`
- `analyzeTerrain(terrainData)` - Analizar condiciones del terreno
- `findCompatibleTractors(terrainData, tractorsList)` - Filtrar tractores compatibles
- `findCompatibleImplements(terrainData, tractorData, implementsList)` - Filtrar implementos
- `calculateCompatibilityScore(tractor, implement, terrain)` - Calcular puntuación (0-100)
- `generateRecommendation(terrainData, workType)` - Generar recomendación completa

**Criterios de compatibilidad:**
- Potencia del tractor suficiente para el terreno
- Tracción adecuada para pendiente y tipo de suelo
- Implemento compatible con potencia disponible
- Peso del tractor adecuado para el terreno

**4. Crear Controlador de Cálculos**
- **Archivo:** `src/controllers/calculationController.js`
- `calculatePowerLoss(req, res)` - Endpoint para calcular pérdida de potencia
  - Recibe: tractor_id, terrain_id, working_speed_kmh, carried_objects_weight_kg
  - Usa: powerLossService
  - Guarda resultado en tabla power_loss
  - Retorna: pérdidas detalladas y potencia neta
  
- `calculateMinimumPower(req, res)` - Endpoint para potencia mínima
  - Recibe: implement_id, terrain_id
  - Usa: minimumPowerService
  - Retorna: potencia mínima requerida y tractores compatibles

- `getCalculationHistory(req, res)` - Historial de cálculos del usuario

**5. Crear Controlador de Recomendaciones**
- **Archivo:** `src/controllers/recommendationController.js`
- `generateRecommendation(req, res)` - Generar recomendación
  - Recibe: terrain_id, work_type
  - Usa: recommendationService
  - Guarda en tabla recommendation
  - Retorna: top 3 combinaciones tractor + implemento
  
- `getRecommendationHistory(req, res)` - Historial de recomendaciones
- `getRecommendationById(req, res)` - Detalle de recomendación

**6. Crear Rutas de Cálculos**
- **Archivo:** `src/routes/calculation.routes.js`
```javascript
POST   /api/calculations/power-loss        (requiere autenticación)
POST   /api/calculations/minimum-power     (requiere autenticación)
GET    /api/calculations/history           (requiere autenticación)
```

**7. Crear Rutas de Recomendaciones**
- **Archivo:** `src/routes/recommendation.routes.js`
```javascript
POST   /api/recommendations/generate       (requiere autenticación)
GET    /api/recommendations/history        (requiere autenticación)
GET    /api/recommendations/:id            (requiere autenticación)
```

**8. Crear Middleware de Validación de Cálculos**
- **Archivo:** `src/middleware/calculationValidation.middleware.js`
- Validar que existan los IDs de tractor, terreno, implemento
- Validar valores numéricos (velocidad > 0, peso >= 0, etc.)

**Notas importantes:**
- Las fórmulas son críticas, verificar con precisión
- Documentar cada fórmula con comentarios
- Manejar casos donde no hay tractores/implementos compatibles
- Registrar cada cálculo en query_history

**Tiempo estimado:** 12-15 horas

---

## 🔧 Tareas Comunes (Todos)

### Middleware de Manejo de Errores
- **Archivo:** `src/middleware/error.middleware.js`
- `notFound(req, res, next)` - Ruta no encontrada (404)
- `errorHandler(err, req, res, next)` - Manejo centralizado de errores

### Utilidades de Respuesta
- **Archivo:** `src/utils/response.util.js`
- `successResponse(res, data, message, statusCode)`
- `errorResponse(res, message, statusCode)`

### Integración en app.js
Una vez completadas las rutas, integrarlas en `src/app.js`:
```javascript
import authRoutes from './routes/auth.routes.js';
import tractorRoutes from './routes/tractor.routes.js';
import implementRoutes from './routes/implement.routes.js';
import terrainRoutes from './routes/terrain.routes.js';
import calculationRoutes from './routes/calculation.routes.js';
import recommendationRoutes from './routes/recommendation.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/tractors', tractorRoutes);
app.use('/api/implements', implementRoutes);
app.use('/api/terrains', terrainRoutes);
app.use('/api/calculations', calculationRoutes);
app.use('/api/recommendations', recommendationRoutes);
```

---

## 📚 Recursos y Referencias

### Documentación útil:
- **Express.js:** https://expressjs.com/
- **JWT:** https://www.npmjs.com/package/jsonwebtoken
- **Bcrypt:** https://www.npmjs.com/package/bcrypt
- **PostgreSQL pg:** https://node-postgres.com/

### Estructura de respuestas:
```javascript
// Success
{
  success: true,
  message: "Operación exitosa",
  data: { ... }
}

// Error
{
  success: false,
  message: "Mensaje de error",
  error: "Detalle del error"
}
```

### Códigos HTTP a usar:
- 200: OK (GET, PUT exitoso)
- 201: Created (POST exitoso)
- 204: No Content (DELETE exitoso)
- 400: Bad Request (datos inválidos)
- 401: Unauthorized (no autenticado)
- 403: Forbidden (sin permisos)
- 404: Not Found (recurso no existe)
- 500: Internal Server Error (error del servidor)

---

## 🎯 Orden de Implementación Sugerido

1. **Julian** - Empezar con autenticación (es base para todo)
2. **Juan Esteban** - Empezar con CRUD de tractores y terrenos (necesarios para cálculos)
3. **Brayan** - Una vez Julian termine JWT y Juan tenga tractores, empezar con servicios

### Coordinación:
- Usar las mismas utilidades de respuesta
- Usar el mismo formato de manejo de errores
- Probar endpoints con **Postman** o **Thunder Client**
- Hacer commits frecuentes a Git

---

## ✅ Checklist de Completitud

### Julian Medina Monje
- [ ] Middleware de autenticación (verifyToken, isAdmin)
- [ ] Utilidad JWT (generateToken, verifyToken)
- [ ] Controlador de autenticación completo
- [ ] Rutas de autenticación funcionando
- [ ] Controlador y rutas de roles
- [ ] Endpoints probados con Postman

### Juan Esteban Rojas
- [ ] Controlador de tractores completo
- [ ] Rutas de tractores funcionando
- [ ] Controlador de implementos completo
- [ ] Rutas de implementos funcionando
- [ ] Middleware de validación
- [ ] Controlador y rutas de terrenos
- [ ] Endpoints probados con Postman

### Brayan Toro
- [ ] Servicio de pérdida de potencia con fórmulas
- [ ] Servicio de potencia mínima
- [ ] Servicio de recomendaciones
- [ ] Controlador de cálculos
- [ ] Controlador de recomendaciones
- [ ] Rutas de cálculos y recomendaciones
- [ ] Middleware de validación de cálculos
- [ ] Endpoints probados con Postman

---

## 🚀 Testing de Endpoints

Usar Postman o Thunder Client para probar. Ejemplo:

**POST /api/auth/register**
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "SecurePass123",
  "role_id": 2
}
```

**POST /api/auth/login**
```json
{
  "email": "admin@maqagr.com",
  "password": "admin123"
}
```

**POST /api/calculations/power-loss**
```json
{
  "tractor_id": 1,
  "terrain_id": 1,
  "working_speed_kmh": 5.5,
  "carried_objects_weight_kg": 200
}
```

---

## 📞 Contacto y Coordinación

- Crear un grupo de WhatsApp o Discord
- Hacer reuniones diarias de 15 min (daily standup)
- Compartir avances en Git
- Ayudarse mutuamente cuando haya bloqueos

**¡Éxito en el desarrollo!** 🚜💪
