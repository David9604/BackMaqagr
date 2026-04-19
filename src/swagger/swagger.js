/**
 * Configuración de Swagger/OpenAPI para la API de MaqAgr
 * Documentación completa de todos los endpoints
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { schemas } from './schemas.js';

const options = {
  swaggerDefinition: {
    openapi: '3.0.3',
    info: {
      title: 'MaqAgr API - Sistema de Maquinaria Agrícola',
      version: '1.0.0',
      description: `
## API REST para gestión de maquinaria agrícola

Sistema integral para la gestión de tractores, implementos agrícolas y terrenos.
Incluye cálculos de potencia, pérdidas energéticas y recomendaciones inteligentes
de tractores basadas en las características del terreno y el implemento seleccionado.

### Funcionalidades principales:
- 🔐 **Autenticación**: Registro, login, gestión de perfil con JWT
- 🚜 **Tractores**: Catálogo completo con búsqueda y filtros
- 🔧 **Implementos**: Gestión de implementos agrícolas
- 🌍 **Terrenos**: Terrenos por usuario con validación de propiedad
- ⚡ **Cálculos**: Pérdidas de potencia y potencia mínima requerida
- 🎯 **Recomendaciones**: Sistema inteligente de recomendación de tractores
- 👥 **Roles**: Gestión de roles del sistema (admin)

### Autenticación:
La API usa **JWT (JSON Web Tokens)**. Incluye el token en el header:
\`\`\`
Authorization: Bearer <tu_token>
\`\`\`
      `,
      contact: {
        name: 'Equipo MaqAgr',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa tu token JWT obtenido del endpoint /api/auth/login',
        },
      },
      schemas,
    },
    tags: [
      {
        name: 'Auth',
        description: 'Endpoints de autenticación y gestión de perfil',
      },
      {
        name: 'Tractors',
        description: 'Catálogo de tractores (lectura pública, escritura admin)',
      },
      {
        name: 'Implements',
        description: 'Catálogo de implementos agrícolas (lectura pública, escritura admin)',
      },
      {
        name: 'Terrains',
        description: 'Gestión de terrenos del usuario autenticado',
      },
      {
        name: 'Calculations',
        description: 'Cálculos de potencia y pérdidas energéticas',
      },
      {
        name: 'Recommendations',
        description: 'Sistema de recomendación inteligente de tractores',
      },
      {
        name: 'Admin',
        description: 'Analytics, estadísticas y métricas administrativas',
      },
      {
        name: 'Exports',
        description: 'Exportación de catálogos y recomendaciones',
      },
      {
        name: 'Roles',
        description: 'Gestión de roles del sistema (solo administradores)',
      },
    ],
  },
  apis: [
    './src/routes/*.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Configura Swagger UI en la aplicación Express
 * @param {import('express').Application} app - Instancia de Express
 */
export const setupSwagger = (app) => {
  // Dynamic spec endpoint — injects current host as server URL in production
  app.get('/api-docs.json', (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;

    const dynamicSpec = {
      ...swaggerSpec,
      servers: [{
        url: `${protocol}://${host}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      }],
    };

    res.setHeader('Content-Type', 'application/json');
    res.send(dynamicSpec);
  });

  // Swagger UI — fetches spec from /api-docs.json for dynamic server URL
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(null, {
      swaggerUrl: '/api-docs.json',
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'MaqAgr API Docs',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        tagsSorter: 'alpha',
        operationsSorter: 'method',
      },
    })
  );
};

export default swaggerSpec;
