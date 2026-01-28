# 🚜 Plan de Desarrollo - Backend MaqAgr

## 📋 Descripción del Proyecto

Sistema backend para una aplicación web agrícola que permite:

1. **Cálculo de pérdida de potencia** en tractores según datos del terreno y variables operacionales
2. **Cálculo de potencia mínima** requerida por implementos agrícolas para ser utilizados por tractores
3. **Sistema de recomendación** de tractores e implementos según características del terreno

### Stack Tecnológico
- **Backend**: Node.js + Express
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT (JSON Web Tokens)
- **Seguridad**: Bcrypt para hash de contraseñas
- **Patrón**: MVC (Modelo-Vista-Controlador)

---

## 🗄️ FASE 1: Configuración de Base de Datos

### ✅ Paso 1.1: Revisar la conexión a PostgreSQL
**Archivo**: `src/config/db.js`
- Configurar variables de entorno en `.env`
- Verificar pool de conexiones

### ✅ Paso 1.2: Crear el Schema de Base de Datos
**Archivo**: `database/schema.sql`
- ✅ Script SQL completo con todas las tablas
- ✅ Definición de relaciones y claves foráneas
- ✅ Índices para optimización
- ✅ Datos de prueba iniciales

**Tablas principales:**
- `Usuarios` - Gestión de usuarios del sistema
- `Rol` - Roles de usuarios
- `Terreno` - Información de terrenos agrícolas
- `Tractor` - Catálogo de tractores
- `Implemento` - Catálogo de implementos agrícolas
- `Consulta` - Registro de consultas de cálculo
- `Perdida_potencia` - Resultados de cálculos de pérdida
- `Recomendacion` - Sistema de recomendaciones
- `Historial_consulta` - Historial de acciones de usuarios

### 📝 Paso 1.3: Ejecutar el Script SQL
```bash
# Crear la base de datos
psql -U postgres
CREATE DATABASE maqagr_db;
\q

# Ejecutar el schema
psql -U postgres -d maqagr_db -f database/schema.sql
```

---

## 📦 FASE 2: Crear los Modelos (Models)

Los modelos manejan la lógica de acceso a datos y consultas SQL.

### Paso 2.1: Modelo de Usuario
**Archivo**: `src/models/Usuario.js`
```javascript
Métodos:
- create(nombre, email, password)
- findByEmail(email)
- findById(id)
- update(id, data)
- delete(id)
- updateLastSession(id)
```

### Paso 2.2: Modelo de Tractor
**Archivo**: `src/models/Tractor.js`
```javascript
Métodos:
- getAll()
- getById(id)
- create(data)
- update(id, data)
- delete(id)
- searchByPotencia(minHP, maxHP)
- searchByMarca(marca)
```

### Paso 2.3: Modelo de Implemento
**Archivo**: `src/models/Implemento.js`
```javascript
Métodos:
- getAll()
- getById(id)
- create(data)
- update(id, data)
- delete(id)
- findByTipo(tipo)
- findByPotenciaRequerida(maxHP)
```

### Paso 2.4: Modelo de Terreno
**Archivo**: `src/models/Terreno.js`
```javascript
Métodos:
- getAll()
- getById(id)
- create(data)
- update(id, data)
- delete(id)
- findByTipoSuelo(tipo)
```

### Paso 2.5: Modelo de Consulta
**Archivo**: `src/models/Consulta.js`
```javascript
Métodos:
- create(data)
- findByUsuario(userId)
- findById(id)
- getHistorialByUsuario(userId)
```

### Paso 2.6: Modelo de PerdidaPotencia
**Archivo**: `src/models/PerdidaPotencia.js`
```javascript
Métodos:
- create(consultaId, resultados)
- findByConsulta(consultaId)
- calcularPerdidas(datosConsulta)
```

### Paso 2.7: Modelo de Recomendacion
**Archivo**: `src/models/Recomendacion.js`
```javascript
Métodos:
- create(data)
- findByUsuario(userId)
- findByTerreno(terrenoId)
- calcularCompatibilidad(terrenoData)
```

### Paso 2.8: Modelo de Ned
**Archivo**: `src/models/Ned.js`
```javascript
Métodos:
- getAll()
- getById(id)
- findByNombre(nombre)
```

---

## 🎮 FASE 3: Crear los Controladores (Controllers)

Los controladores manejan la lógica de negocio y responden a las peticiones HTTP.

### Paso 3.1: Controlador de Autenticación
**Archivo**: `src/controllers/authController.js`
```javascript
Funciones:
- register(req, res) - Registrar nuevo usuario
- login(req, res) - Iniciar sesión y generar JWT
- logout(req, res) - Cerrar sesión
- getProfile(req, res) - Obtener perfil del usuario
- updateProfile(req, res) - Actualizar datos del usuario
```

### Paso 3.2: Controlador de Tractores
**Archivo**: `src/controllers/tractorController.js`
```javascript
Funciones:
- getAllTractores(req, res)
- getTractorById(req, res)
- createTractor(req, res)
- updateTractor(req, res)
- deleteTractor(req, res)
- searchTractores(req, res)
```

### Paso 3.3: Controlador de Implementos
**Archivo**: `src/controllers/implementoController.js`
```javascript
Funciones:
- getAllImplementos(req, res)
- getImplementoById(req, res)
- createImplemento(req, res)
- updateImplemento(req, res)
- deleteImplemento(req, res)
- searchImplementos(req, res)
```

### Paso 3.4: Controlador de Terrenos
**Archivo**: `src/controllers/terrenoController.js`
```javascript
Funciones:
- getAllTerrenos(req, res)
- getTerrenoById(req, res)
- createTerreno(req, res)
- updateTerreno(req, res)
- deleteTerreno(req, res)
```

### Paso 3.5: Controlador de Cálculos (⭐ CORE DEL SISTEMA)
**Archivo**: `src/controllers/calculoController.js`
```javascript
Funciones:
- calcularPerdidaPotencia(req, res)
  * Calcula pérdidas por pendiente
  * Calcula pérdidas por altitud
  * Calcula pérdidas por resistencia a la rodadura
  * Calcula pérdidas por patinaje
  * Retorna potencia neta disponible

- calcularPotenciaMinima(req, res)
  * Calcula potencia requerida por el implemento
  * Considera tipo de suelo y condiciones
  * Verifica compatibilidad con tractores

- obtenerHistorialCalculos(req, res)
  * Retorna historial de cálculos del usuario
```

### Paso 3.6: Controlador de Recomendaciones (⭐ CORE DEL SISTEMA)
**Archivo**: `src/controllers/recomendacionController.js`
```javascript
Funciones:
- generarRecomendacion(req, res)
  * Analiza datos del terreno
  * Evalúa tractores disponibles
  * Evalúa implementos compatibles
  * Calcula puntuación de compatibilidad
  * Retorna recomendaciones ordenadas

- obtenerHistorialRecomendaciones(req, res)
```

---

## 🛣️ FASE 4: Crear las Rutas (Routes)

### Paso 4.1: Rutas de Autenticación
**Archivo**: `src/routes/auth.routes.js`
```javascript
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/profile
PUT    /api/auth/profile
```

### Paso 4.2: Rutas de Tractores
**Archivo**: `src/routes/tractor.routes.js`
```javascript
GET    /api/tractores
GET    /api/tractores/:id
POST   /api/tractores
PUT    /api/tractores/:id
DELETE /api/tractores/:id
GET    /api/tractores/search
```

### Paso 4.3: Rutas de Implementos
**Archivo**: `src/routes/implemento.routes.js`
```javascript
GET    /api/implementos
GET    /api/implementos/:id
POST   /api/implementos
PUT    /api/implementos/:id
DELETE /api/implementos/:id
GET    /api/implementos/search
```

### Paso 4.4: Rutas de Terrenos
**Archivo**: `src/routes/terreno.routes.js`
```javascript
GET    /api/terrenos
GET    /api/terrenos/:id
POST   /api/terrenos
PUT    /api/terrenos/:id
DELETE /api/terrenos/:id
```

### Paso 4.5: Rutas de Cálculos
**Archivo**: `src/routes/calculo.routes.js`
```javascript
POST   /api/calculos/perdida-potencia
POST   /api/calculos/potencia-minima
GET    /api/calculos/historial
```

### Paso 4.6: Rutas de Recomendaciones
**Archivo**: `src/routes/recomendacion.routes.js`
```javascript
POST   /api/recomendaciones/generar
GET    /api/recomendaciones/historial
GET    /api/recomendaciones/:id
```

---

## 🛡️ FASE 5: Middleware

### Paso 5.1: Middleware de Autenticación
**Archivo**: `src/middleware/auth.middleware.js`
```javascript
Funciones:
- verifyToken(req, res, next)
- isAdmin(req, res, next)
```

### Paso 5.2: Middleware de Validación
**Archivo**: `src/middleware/validation.middleware.js`
```javascript
Funciones:
- validateUsuario(req, res, next)
- validateTractor(req, res, next)
- validateImplemento(req, res, next)
- validateTerreno(req, res, next)
- validateCalculoRequest(req, res, next)
```

### Paso 5.3: Middleware de Errores
**Archivo**: `src/middleware/error.middleware.js`
```javascript
Funciones:
- notFound(req, res, next)
- errorHandler(err, req, res, next)
```

---

## 🧮 FASE 6: Servicios de Cálculo (Services)

Estos servicios contienen las fórmulas matemáticas para los cálculos agrícolas.

### Paso 6.1: Servicio de Pérdida de Potencia
**Archivo**: `src/services/perdidaPotenciaService.js`
```javascript
Funciones:
- calcularPerdidaPorPendiente(pendiente, peso, velocidad)
- calcularPerdidaPorAltitud(altitud, potenciaMotor)
- calcularPerdidaPorResistenciaRodadura(peso, coeficiente)
- calcularPerdidaPorPatinaje(traccion, tipoSuelo)
- calcularPerdidaTotal(datosCompletos)
```

### Paso 6.2: Servicio de Potencia Mínima
**Archivo**: `src/services/potenciaMinimaService.js`
```javascript
Funciones:
- calcularPotenciaImplemento(implemento, terreno)
- verificarCompatibilidadTractor(tractor, potenciaRequerida)
```

### Paso 6.3: Servicio de Recomendación
**Archivo**: `src/services/recomendacionService.js`
```javascript
Funciones:
- analizarTerreno(terreno)
- filtrarTractoresCompatibles(terreno, tractores)
- filtrarImplementosCompatibles(terreno, implementos)
- calcularPuntuacionCompatibilidad(tractor, implemento, terreno)
- generarRecomendacionFinal(datos)
```

---

## 🔧 FASE 7: Utilidades

### Paso 7.1: Utilidades JWT
**Archivo**: `src/utils/jwt.util.js`
```javascript
Funciones:
- generateToken(payload)
- verifyToken(token)
```

### Paso 7.2: Utilidades de Respuesta
**Archivo**: `src/utils/response.util.js`
```javascript
Funciones:
- successResponse(res, data, message, statusCode)
- errorResponse(res, message, statusCode)
```

### Paso 7.3: Validadores
**Archivo**: `src/utils/validators.util.js`
```javascript
Funciones:
- isValidEmail(email)
- isValidPassword(password)
- isPositiveNumber(value)
```

---

## 🧪 FASE 8: Testing (Opcional pero Recomendado)

### Paso 8.1: Configurar Jest
```bash
npm install --save-dev jest supertest
```

### Paso 8.2: Tests Unitarios
**Directorio**: `tests/unit/`
- Testear servicios de cálculo
- Testear utilidades

### Paso 8.3: Tests de Integración
**Directorio**: `tests/integration/`
- Testear endpoints de API
- Testear flujos completos

---

## 📚 FASE 9: Documentación

### Paso 9.1: Documentar API con Swagger
**Archivo**: `src/config/swagger.js`

### Paso 9.2: README del Proyecto
**Archivo**: `README.md`
- Instrucciones de instalación
- Variables de entorno
- Endpoints disponibles
- Ejemplos de uso

---

## 🚀 FASE 10: Despliegue

### Paso 10.1: Variables de Entorno
**Archivo**: `.env.example`
```env
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=maqagr_db
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=tu_secret_key
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

### Paso 10.2: Scripts de NPM
Actualizar `package.json`:
```json
"scripts": {
  "start": "node src/app.js",
  "dev": "nodemon src/app.js",
  "db:migrate": "psql -U postgres -d maqagr_db -f database/schema.sql",
  "test": "jest"
}
```

---

## 📊 Orden de Implementación Sugerido

1. ✅ **Base de Datos** - Schema SQL (COMPLETADO)
2. **Configuración** - Variables de entorno y conexión DB
3. **Modelos** - Empezar por Usuario, Tractor, Implemento, Terreno
4. **Autenticación** - Controller, routes y middleware de auth
5. **CRUD Básico** - Tractores, Implementos, Terrenos
6. **Servicios de Cálculo** - Fórmulas matemáticas
7. **Controladores de Cálculo** - Integrar servicios con API
8. **Sistema de Recomendación** - Lógica compleja
9. **Testing y Validación**
10. **Documentación**

---

## 📝 Notas Importantes

### Fórmulas de Cálculo a Implementar:

**Pérdida por Pendiente:**
```
HP_pendiente = (Peso_total * velocidad * pendiente) / 273
```

**Pérdida por Altitud:**
```
HP_altitud = Potencia_motor * (0.03 * (altitud / 300))
```

**Pérdida por Resistencia a la Rodadura:**
```
HP_rodadura = (Peso_total * coef_rodadura * velocidad) / 273
```

**Pérdida por Patinaje:**
```
Patinaje = f(tipo_tracción, tipo_suelo, peso_tractor)
HP_patinaje = Potencia_motor * (patinaje / 100)
```

---

## 🎯 Estado Actual

- ✅ Estructura del proyecto creada
- ✅ Dependencias instaladas
- ✅ Schema SQL completo
- ⏳ Pendiente: Implementación de modelos
- ⏳ Pendiente: Implementación de controladores
- ⏳ Pendiente: Implementación de rutas
- ⏳ Pendiente: Lógica de cálculos

---

**Fecha de inicio**: 27 de enero de 2026
**Última actualización**: 27 de enero de 2026
