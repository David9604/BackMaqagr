# BackMaqAgr - API de Gestión Agrícola

![Node.js](https://img.shields.io/badge/Node.js-v24.13.0+-green?style=flat&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue?style=flat&logo=postgresql)
![Express](https://img.shields.io/badge/Express-5.2.1-lightgrey?style=flat&logo=express)
![Status](https://img.shields.io/badge/Status-Active-success)

**API REST robusta** diseñada para la gestión integral de maquinaria agrícola. Permite administrar inventarios de tractores e implementos, caracterizar terrenos y realizar cálculos de ingeniería complejos (pérdidas de potencia, recomendaciones de maquinaria) basados en física aplicada.

---

## Tabla de Contenidos
- [Instalación y Ejecución](#-instalación-y-ejecución)
- [Testing](#-testing)
- [Formato de Respuestas](#-formato-de-respuestas)
- [Códigos HTTP](#-códigos-http)
- [Autenticación JWT](#-autenticación-jwt)
- [Endpoints](#-endpoints)
  - [Auth](#-autenticación-apiauth)
  - [Tractores](#-tractores-apitractors)
  - [Implementos](#-implementos-apiimplements)
  - [Terrenos](#-terrenos-apiterrains)
  - [Cálculos](#-cálculos-apicalculations)
  - [Recomendaciones](#-recomendaciones-apirecommendations)

---

## Instalación y Ejecución

### Requisitos
- **Node.js** v24.13.0+
- **PostgreSQL** v12+
- **pnpm**

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/David9604/BackMaqagr.git
cd BackMaqagr
npm install
```

### Configuración

```bash
cp .env.example .env
# Editar .env con credenciales DB y JWT_SECRET
```

### Base de Datos

```bash
createdb MaqAgr
psql -d MaqAgr -f docs/dbSetting/users_202601311817.sql
psql -d MaqAgr -f docs/dbSetting/tractor_202601311817.sql
psql -d MaqAgr -f docs/dbSetting/implement_202601311817.sql
psql -d MaqAgr -f docs/dbSetting/terrain_202601311817.sql
psql -d MaqAgr -f database/indexes.sql
```

### Ejecución

```bash
npm run dev  # Desarrollo
npm start    # Producción
```

Servidor en: `http://localhost:4000
---

## [~] Formato de Respuestas Standard

Todas las respuestas de la API siguen el estándar **JSend**:

### [OK] Respuestas Exitosas

```json
{
  "success": true,
  "message": "Descripción de la operación",
  "data": { ... }
}
```

### [X] Respuestas de Error

```json
{
  "success": false,
  "message": "Descripción del error"
}
```

**En `development` incluye detalles adicionales:**
```json
{
  "success": false,
  "message": "Descripción del error",
  "error": {
    "message": "Detalle técnico",
    "stack": "Stack trace completo",
    "code": "ERROR_CODE"
  }
}
```

### [*] Respuestas Paginadas

```json
{
  "success": true,
  "message": "Datos obtenidos",
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "pageSize": 10,
    "totalItems": 50,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

## [#] Códigos HTTP Utilizados

| Código | Descripción | Uso |
|--------|-------------|-----|
| **200** | OK | Operación exitosa |
| **201** | Created | Recurso creado exitosamente |
| **204** | No Content | Operación exitosa sin contenido |
| **400** | Bad Request | Error de validación o datos inválidos |
| **401** | Unauthorized | Autenticación requerida o token inválido |
| **403** | Forbidden | Sin permisos para acceder al recurso |
| **404** | Not Found | Recurso no encontrado |
| **409** | Conflict | Conflicto (ej: email ya registrado) |
| **500** | Internal Server Error | Error del servidor |

---

## [LOCK] Autenticación JWT

El sistema utiliza **JSON Web Tokens (Bearer Token)** para proteger los endpoints.

### Flujo de Auth

1. El usuario se loguea (`POST /api/auth/login`).
2. Recibe un `token` con duración de **24h**.
3. Debe enviar este token en el header `Authorization` para peticiones futuras.

### Estructura del Token

**Payload:**
```j
{
  "user_id": 1,
  "email": "user@example.com",
  "role_id": 2,
  "name": "Usuario"
}
```

**Configuración:**
- Algoritmo: HS256
- Expiración: 24 horas (configurable en `.env`)
- Secret: Definido en `JWT_SECRET`

**Header de Ejemplo:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## [##] Endpoints Principales

A continuación se listan las rutas más relevantes. Para ver la colección completa, importa el archivo de Postman o revisa la carpeta `src/routes`.

### [KEY] Autenticación (`/api/auth`)

| Método | Endpoint | Descripción | Auth |
| --- | --- | --- | --- |
| `POST` | `/register` | Registrar nuevo usuario | No |
| `POST` | `/login` | Iniciar sesión y obtener Token | No |
| `GET` | `/profile` | Ver datos del usuario actual | **Sí** |

#### Registro

**Request:**
```json
POST /api/auth/register

{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "SecurePass123"
}
```

**Requisitos de contraseña:**
- Mínimo 8 caracteres
- Al menos una letra mayúscula
- Al menos un número

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "user_id": 1,
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "role_id": 2,
      "status": "active"
    },
    "token": "eyJhbGci..."
  }
}
```

#### Login

**Request:**
```json
POST /api/auth/login

{
  "email": "juan@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "token": "eyJhbGci...",
    "user": {
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "role_id": 2
    }
  }
}
```

#### Obtener Perfil (Protegido)

**Request:**
```http
GET /api/auth/profile
Authorization: Bearer eyJhbGci...
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Perfil obtenido exitosamente",
  "data": {
    "user": {
      "user_id": 1,
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "role_id": 2,
      "role_name": "Usuario",
      "status": "active",
      "registration_date": "2026-02-07T10:00:00.000Z"
    }
  }
}
```

---

### [=] Tractores (`/api/tractors`)

| Método | Endpoint | Descripción | Auth |
| --- | --- | --- | --- |
| `GET` | `/` | Listar todos los tractores | **Sí** |
| `GET` | `/:id` | Detalles de un tractor | **Sí** |
| `POST` | `/` | Crear tractor (Admin) | **Sí** |

**Response ejemplo (200 OK):**
```json
{
  "success": true,
  "message": "Tractores obtenidos exitosamente",
  "data": [
    {
      "tractor_id": 1,
      "name": "John Deere 5075E",
      "power": 75,
      "weight": 3200,
      "brand": "John Deere",
      "model": "5075E"
    }
  ]
}
```

---

### [W] Implementos (`/api/implements`)

| Método | Endpoint | Descripción | Auth |
| --- | --- | --- | --- |
| `GET` | `/` | Listar todos los implementos | **Sí** |
| `GET` | `/:id` | Detalles de un implemento | **Sí** |

**Response ejemplo (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "implement_id": 1,
      "name": "Arado de Discos",
      "type": "Arado",
      "weight": 500,
      "working_width": 2.5
    }
  ]
}
```

---

### [~] Terrenos (`/api/terrains`)

| Método | Endpoint | Descripción | Auth |
| --- | --- | --- | --- |
| `GET` | `/` | Listar terrenos del usuario | **Sí** |
| `POST` | `/` | Crear nuevo terreno | **Sí** |

**Request (POST):**
```json
{
  "name": "Finca Valle Verde",
  "soil_type": "Franco",
  "slope": 5.5,
  "altitude": 1200,
  "area_hectares": 10.5
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Terreno creado exitosamente",
  "data": {
    "terrain_id": 1,
    "name": "Finca Valle Verde",
    "soil_type": "Franco",
    "slope": 5.5
  }
}
```

---

### [!] Cálculos (`/api/calculations`)

Motor de física agrícola que implementa fórmulas académicas (Prof. Chaparro) para determinar eficiencia.

#### 1. Calcular Pérdidas de Potencia

Calcula la potencia neta disponible descontando pérdidas por altitud, pendiente y rodadura.

**Endpoint:** `POST /api/calculations/power`

**Body:**
```json
{
  "tractor_id": 1,
  "terrain_id": 1,
  "working_speed_kmh": 7.5,
  "carried_objects_weight_kg": 200,
  "slippage_percent": 12
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Cálculo realizado con éxito",
  "data": {
    "queryId": 1,
    "results": {
      "grossPower": 75,
      "losses": { "total": 22.73 },
      "netPower": 52.27,
      "efficiency": 69.69
    }
  }
}
```

#### 2. Potencia Mínima Requerida

Determina qué potencia necesita un implemento para operar en cierto terreno.

**Endpoint:** `POST /api/calculations/minimum-power`

**Body:**
```json
{
  "implement_id": 1,
  "terrain_id": 1,
  "working_speed_kmh": 6.5
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "minimumPowerRequired": 45.5,
    "implement": { "..." : "..." },
    "terrain": { "..." : "..." }
  }
}
```

---

### [*] Recomendaciones (`/api/recommendations`)

Algoritmo inteligente que sugiere el mejor tractor para una labor específica.

**Endpoint:** `POST /api/recommendations`

**Body:**
```json
{
  "terrain_id": 1,
  "implement_id": 1,
  "working_speed_kmh": 7.0
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Recomendaciones generadas",
  "data": {
    "recommendations": [
      {
        "rank": 1,
        "tractor": "John Deere 5075E",
        "score": 95,
        "reason": "Eficiencia óptima de combustible y tracción adecuada."
      }
    ]
  }
}
```

---

## [O] Variables de Entorno (.env)

| Variable | Descripción | Valor por Defecto |
| --- | --- | --- |
| `PORT` | Puerto del servidor Express | `4000` |
| `NODE_ENV` | Entorno (development/production) | `development` |
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_NAME` | Nombre de la base de datos | `MaqAgr` |
| `DB_USER` | Usuario de PostgreSQL | `postgres` |
| `DB_PASS` | Contraseña de PostgreSQL | - |
| `JWT_SECRET` | Llave secreta para firmar tokens | - |
| `JWT_EXPIRES_IN` | Duración del token | `24h` |

---

## [TOOLS] Utilidades Implementadas

### Logger
Sistema de logging centralizado con niveles ERROR, WARN, INFO, DEBUG y middleware automático de HTTP.

```javascript
import logger from './utils/logger.js';

logger.info('Usuario registrado', { userId: 1 });
logger.error('Error en operación', error);
```

### Validadores
20+ funciones de validación reutilizables para email, contraseña, números, coordenadas, UUID, etc.

```javascript
import { isValidEmail, isValidPassword, isPositiveNumber } from './utils/validators.util.js';
```

### Respuestas Estandarizadas
10 funciones para respuestas consistentes: `successResponse`, `createdResponse`, `validationErrorResponse`, `notFoundResponse`, `conflictResponse`, `paginatedResponse`, etc.

```javascript
import { successResponse, createdResponse, validationErrorResponse } from './utils/response.util.js';

return successResponse(res, data, 'Operación exitosa');
return validationErrorResponse(res, errors);
```

### Error Middleware
Manejo centralizado de errores con detección automática de errores JWT, PostgreSQL y validación. Incluye `asyncHandler` para eliminar try-catch repetitivos.

```javascript
import { asyncHandler, AppError } from '../middleware/error.middleware.js';

const myRoute = asyncHandler(async (req, res) => {
  // Sin try-catch, los errores se capturan automáticamente
});
```

---

## 🧪 Testing

El proyecto cuenta con una suite completa de tests unitarios y end-to-end (E2E).

### Quick Start

```bash
# Ejecutar todos los tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests en modo watch (desarrollo)
npm run test:watch

# Tests E2E solamente
npm run test:e2e

# Tests unitarios solamente
npm run test:unit
```

### Cobertura

- [x] **Tests Unitarios**: Middleware, utilidades, validaciones
- [x] **Tests E2E**: Flujos completos de autenticación, cálculos y recomendaciones
- [x] **Helpers**: Factory de datos, cliente API, limpieza de DB
- [=] **Total**: 97+ tests implementados