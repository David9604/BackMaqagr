/**
 * Schemas globales de Swagger/OpenAPI
 * Define todos los modelos de datos, respuestas y errores
 */

export const schemas = {
  // ==========================================
  // RESPUESTAS GLOBALES
  // ==========================================
  SuccessResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Operación exitosa',
      },
      data: {
        type: 'object',
        description: 'Datos de la respuesta (varía según el endpoint)',
      },
    },
  },

  ErrorResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false,
      },
      message: {
        type: 'string',
        example: 'Error en la operación',
      },
      errors: {
        type: 'array',
        items: { type: 'string' },
        description: 'Lista detallada de errores (opcional)',
        example: ['Campo requerido faltante', 'Formato inválido'],
      },
    },
  },

  PaginatedResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      data: {
        type: 'array',
        items: { type: 'object' },
      },
      pagination: {
        type: 'object',
        properties: {
          total: { type: 'integer', example: 50 },
          limit: { type: 'integer', example: 10 },
          offset: { type: 'integer', example: 0 },
        },
      },
    },
  },

  // ==========================================
  // AUTH SCHEMAS
  // ==========================================
  UserRegister: {
    type: 'object',
    required: ['name', 'email', 'password'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        example: 'Juan Pérez',
        description: 'Nombre completo del usuario',
      },
      email: {
        type: 'string',
        format: 'email',
        example: 'juan@example.com',
        description: 'Email único del usuario',
      },
      password: {
        type: 'string',
        minLength: 8,
        example: 'MiPassword123!',
        description: 'Contraseña segura (mín. 8 caracteres, mayúscula, minúscula, número y carácter especial)',
      },
    },
  },

  UserLogin: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'juan@example.com',
      },
      password: {
        type: 'string',
        example: 'MiPassword123!',
      },
    },
  },

  UserProfile: {
    type: 'object',
    properties: {
      user_id: { type: 'integer', example: 1 },
      name: { type: 'string', example: 'Juan Pérez' },
      email: { type: 'string', format: 'email', example: 'juan@example.com' },
      role_id: { type: 'integer', example: 2 },
      role_name: { type: 'string', example: 'user' },
      status: { type: 'string', enum: ['active', 'inactive', 'suspended'], example: 'active' },
      registration_date: { type: 'string', format: 'date-time' },
      last_session: { type: 'string', format: 'date-time', nullable: true },
    },
  },

  UpdateProfile: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        example: 'Juan Pérez Actualizado',
        description: 'Nuevo nombre (opcional)',
      },
      email: {
        type: 'string',
        format: 'email',
        example: 'nuevo@example.com',
        description: 'Nuevo email (opcional)',
      },
    },
  },

  ChangePassword: {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    properties: {
      currentPassword: {
        type: 'string',
        example: 'MiPasswordActual123!',
        description: 'Contraseña actual del usuario',
      },
      newPassword: {
        type: 'string',
        minLength: 8,
        example: 'NuevaPassword456!',
        description: 'Nueva contraseña segura',
      },
    },
  },

  AuthResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Usuario registrado exitosamente' },
      data: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              user_id: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'Juan Pérez' },
              email: { type: 'string', example: 'juan@example.com' },
              role_id: { type: 'integer', example: 2 },
              status: { type: 'string', example: 'active' },
              registration_date: { type: 'string', format: 'date-time' },
            },
          },
          token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            description: 'Token JWT para autenticación',
          },
        },
      },
    },
  },

  LoginResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Inicio de sesión exitoso' },
      data: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          user: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'Juan Pérez' },
              email: { type: 'string', example: 'juan@example.com' },
              role_id: { type: 'integer', example: 2 },
            },
          },
        },
      },
    },
  },

  // ==========================================
  // TRACTOR SCHEMAS
  // ==========================================
  Tractor: {
    type: 'object',
    properties: {
      tractor_id: { type: 'integer', example: 1 },
      name: { type: 'string', example: 'John Deere 6130M' },
      brand: { type: 'string', example: 'John Deere' },
      model: { type: 'string', example: '6130M' },
      engine_power_hp: { type: 'number', format: 'float', example: 130.0 },
      weight_kg: { type: 'number', format: 'float', example: 5200.0 },
      traction_force_kn: { type: 'number', format: 'float', example: 45.5, nullable: true },
      traction_type: { type: 'string', enum: ['4x2', '4x4', 'track'], example: '4x4' },
      tire_type: { type: 'string', example: 'radial', nullable: true },
      tire_width_mm: { type: 'number', format: 'float', example: 540, nullable: true },
      tire_diameter_mm: { type: 'number', format: 'float', example: 1600, nullable: true },
      tire_pressure_psi: { type: 'number', format: 'float', example: 15.0, nullable: true },
      status: { type: 'string', enum: ['available', 'maintenance', 'inactive'], example: 'available' },
    },
  },

  TractorCreate: {
    type: 'object',
    required: ['brand', 'model', 'engine_power_hp', 'traction_type'],
    properties: {
      name: { type: 'string', example: 'John Deere 6130M' },
      brand: { type: 'string', example: 'John Deere' },
      model: { type: 'string', example: '6130M' },
      engine_power_hp: { type: 'number', format: 'float', example: 130.0, description: 'Potencia del motor en HP (debe ser positivo)' },
      weight_kg: { type: 'number', format: 'float', example: 5200.0, description: 'Peso en kg (debe ser positivo)' },
      traction_force_kn: { type: 'number', format: 'float', example: 45.5 },
      traction_type: { type: 'string', enum: ['4x2', '4x4', 'track'], example: '4x4' },
      tire_type: { type: 'string', example: 'radial' },
      tire_width_mm: { type: 'number', format: 'float', example: 540 },
      tire_diameter_mm: { type: 'number', format: 'float', example: 1600 },
      tire_pressure_psi: { type: 'number', format: 'float', example: 15.0 },
      status: { type: 'string', enum: ['available', 'maintenance', 'inactive'], default: 'available' },
    },
  },

  TractorUpdate: {
    type: 'object',
    properties: {
      name: { type: 'string', example: 'John Deere 6130M Updated' },
      brand: { type: 'string', example: 'John Deere' },
      model: { type: 'string', example: '6130M' },
      engine_power_hp: { type: 'number', format: 'float', example: 135.0 },
      weight_kg: { type: 'number', format: 'float', example: 5300.0 },
      traction_force_kn: { type: 'number', format: 'float', example: 46.0 },
      traction_type: { type: 'string', enum: ['4x2', '4x4', 'track'] },
      tire_type: { type: 'string' },
      tire_width_mm: { type: 'number', format: 'float' },
      tire_diameter_mm: { type: 'number', format: 'float' },
      tire_pressure_psi: { type: 'number', format: 'float' },
      status: { type: 'string', enum: ['available', 'maintenance', 'inactive'] },
    },
  },

  // ==========================================
  // IMPLEMENT SCHEMAS
  // ==========================================
  Implement: {
    type: 'object',
    properties: {
      implement_id: { type: 'integer', example: 1 },
      implement_name: { type: 'string', example: 'Arado de discos 3 cuerpos' },
      brand: { type: 'string', example: 'Baldan' },
      power_requirement_hp: { type: 'number', format: 'float', example: 85.0 },
      working_width_m: { type: 'number', format: 'float', example: 1.2 },
      soil_type: { type: 'string', example: 'clay', description: 'Tipo de suelo compatible' },
      working_depth_cm: { type: 'number', format: 'float', example: 30.0 },
      weight_kg: { type: 'number', format: 'float', example: 450.0 },
      implement_type: {
        type: 'string',
        enum: ['plow', 'harrow', 'seeder', 'sprayer', 'harvester', 'cultivator', 'mower', 'trailer', 'other'],
        example: 'plow',
      },
      status: { type: 'string', enum: ['available', 'maintenance', 'inactive'], example: 'available' },
    },
  },

  ImplementCreate: {
    type: 'object',
    required: ['implement_name', 'implement_type'],
    properties: {
      implement_name: { type: 'string', example: 'Arado de discos 3 cuerpos' },
      brand: { type: 'string', example: 'Baldan' },
      power_requirement_hp: { type: 'number', format: 'float', example: 85.0 },
      working_width_m: { type: 'number', format: 'float', example: 1.2 },
      soil_type: { type: 'string', example: 'clay' },
      working_depth_cm: { type: 'number', format: 'float', example: 30.0 },
      weight_kg: { type: 'number', format: 'float', example: 450.0 },
      implement_type: {
        type: 'string',
        enum: ['plow', 'harrow', 'seeder', 'sprayer', 'harvester', 'cultivator', 'mower', 'trailer', 'other'],
        example: 'plow',
      },
      status: { type: 'string', enum: ['available', 'maintenance', 'inactive'], default: 'available' },
    },
  },

  ImplementUpdate: {
    type: 'object',
    properties: {
      implement_name: { type: 'string', example: 'Arado actualizado' },
      brand: { type: 'string', example: 'Baldan' },
      power_requirement_hp: { type: 'number', format: 'float', example: 90.0 },
      working_width_m: { type: 'number', format: 'float', example: 1.4 },
      soil_type: { type: 'string', example: 'loam' },
      working_depth_cm: { type: 'number', format: 'float', example: 35.0 },
      weight_kg: { type: 'number', format: 'float', example: 470.0 },
      implement_type: {
        type: 'string',
        enum: ['plow', 'harrow', 'seeder', 'sprayer', 'harvester', 'cultivator', 'mower', 'trailer', 'other'],
      },
      status: { type: 'string', enum: ['available', 'maintenance', 'inactive'] },
    },
  },

  // ==========================================
  // TERRAIN SCHEMAS
  // ==========================================
  Terrain: {
    type: 'object',
    properties: {
      terrain_id: { type: 'integer', example: 1 },
      user_id: { type: 'integer', example: 1 },
      name: { type: 'string', example: 'Parcela Norte' },
      altitude_meters: { type: 'number', format: 'float', example: 2500.0 },
      slope_percentage: { type: 'number', format: 'float', example: 15.0 },
      soil_type: { type: 'string', example: 'clay', description: 'Tipo de suelo: clay, loam, sand, firm, soft' },
      temperature_celsius: { type: 'number', format: 'float', example: 18.0, nullable: true },
      status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
    },
  },

  TerrainCreate: {
    type: 'object',
    required: ['name', 'altitude_meters', 'slope_percentage', 'soil_type'],
    properties: {
      name: {
        type: 'string',
        example: 'Parcela Norte',
        description: 'Nombre descriptivo del terreno',
      },
      altitude_meters: {
        type: 'number',
        format: 'float',
        example: 2500.0,
        description: 'Altitud en metros sobre el nivel del mar',
      },
      slope_percentage: {
        type: 'number',
        format: 'float',
        example: 15.0,
        description: 'Pendiente del terreno en porcentaje',
      },
      soil_type: {
        type: 'string',
        example: 'clay',
        description: 'Tipo de suelo (clay, loam, sand, firm, soft)',
      },
      temperature_celsius: {
        type: 'number',
        format: 'float',
        example: 18.0,
        description: 'Temperatura promedio en °C (opcional)',
        nullable: true,
      },
      status: {
        type: 'string',
        enum: ['active', 'inactive'],
        default: 'active',
      },
    },
  },

  TerrainUpdate: {
    type: 'object',
    properties: {
      name: { type: 'string', example: 'Parcela Norte Actualizada' },
      altitude_meters: { type: 'number', format: 'float', example: 2600.0 },
      slope_percentage: { type: 'number', format: 'float', example: 12.0 },
      soil_type: { type: 'string', example: 'loam' },
      temperature_celsius: { type: 'number', format: 'float', example: 20.0 },
      status: { type: 'string', enum: ['active', 'inactive'] },
    },
  },

  // ==========================================
  // CALCULATION SCHEMAS
  // ==========================================
  PowerLossRequest: {
    type: 'object',
    required: ['tractor_id', 'terrain_id', 'working_speed_kmh'],
    properties: {
      tractor_id: {
        type: 'integer',
        example: 1,
        description: 'ID del tractor',
      },
      terrain_id: {
        type: 'integer',
        example: 1,
        description: 'ID del terreno',
      },
      working_speed_kmh: {
        type: 'number',
        format: 'float',
        example: 7.5,
        description: 'Velocidad de trabajo en km/h',
      },
      carried_objects_weight_kg: {
        type: 'number',
        format: 'float',
        example: 500,
        default: 0,
        description: 'Peso de objetos transportados en kg (default: 0)',
      },
      slippage_percent: {
        type: 'number',
        format: 'float',
        example: 10,
        default: 10,
        description: 'Porcentaje de deslizamiento (default: 10%)',
      },
    },
  },

  PowerLossResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Cálculo realizado con éxito' },
      data: {
        type: 'object',
        properties: {
          queryId: { type: 'integer', example: 1 },
          tractor: {
            type: 'object',
            properties: {
              brand: { type: 'string', example: 'John Deere' },
              model: { type: 'string', example: '6130M' },
            },
          },
          terrain: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'Parcela Norte' },
              soil_type: { type: 'string', example: 'clay' },
            },
          },
          losses: {
            type: 'object',
            properties: {
              slope_loss_hp: { type: 'number', format: 'float', example: 5.2 },
              altitude_loss_hp: { type: 'number', format: 'float', example: 8.1 },
              rolling_resistance_loss_hp: { type: 'number', format: 'float', example: 12.3 },
              slippage_loss_hp: { type: 'number', format: 'float', example: 6.7 },
              total_loss_hp: { type: 'number', format: 'float', example: 32.3 },
            },
          },
          net_power_hp: { type: 'number', format: 'float', example: 97.7 },
          engine_power_hp: { type: 'number', format: 'float', example: 130.0 },
          efficiency_percentage: { type: 'number', format: 'float', example: 75.15 },
        },
      },
    },
  },

  MinimumPowerRequest: {
    type: 'object',
    required: ['implement_id', 'terrain_id'],
    properties: {
      implement_id: {
        type: 'integer',
        example: 1,
        description: 'ID del implemento agrícola',
      },
      terrain_id: {
        type: 'integer',
        example: 1,
        description: 'ID del terreno',
      },
      working_depth_m: {
        type: 'number',
        format: 'float',
        example: 0.3,
        description: 'Profundidad de trabajo en metros (opcional, máx 1.0). Si no se provee, usa la del implemento.',
      },
    },
  },

  MinimumPowerResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Cálculo de potencia mínima completado' },
      data: {
        type: 'object',
        properties: {
          queryId: { type: 'integer', example: 5 },
          implement: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'Arado de discos' },
              type: { type: 'string', example: 'plow' },
            },
          },
          terrain: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'Parcela Norte' },
              soil_type: { type: 'string', example: 'clay' },
            },
          },
          powerRequirement: {
            type: 'object',
            properties: {
              minimum_power_hp: { type: 'number', format: 'float', example: 95.5 },
              factors: { type: 'object' },
            },
          },
          compatibleTractors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tractor_id: { type: 'integer' },
                name: { type: 'string' },
                brand: { type: 'string' },
                model: { type: 'string' },
                engine_power_hp: { type: 'number', format: 'float' },
                suitability: {
                  type: 'object',
                  properties: {
                    score: { type: 'string', enum: ['OPTIMAL', 'OVERPOWERED', 'INSUFFICIENT'] },
                    label: { type: 'string' },
                    color: { type: 'string' },
                    utilizationPercent: { type: 'integer' },
                    isCompatible: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  // ==========================================
  // RECOMMENDATION SCHEMAS
  // ==========================================
  RecommendationRequest: {
    type: 'object',
    required: ['terrain_id', 'implement_id'],
    properties: {
      terrain_id: {
        type: 'integer',
        example: 1,
        description: 'ID del terreno (debe pertenecer al usuario autenticado)',
      },
      implement_id: {
        type: 'integer',
        example: 1,
        description: 'ID del implemento agrícola',
      },
      working_depth_m: {
        type: 'number',
        format: 'float',
        example: 0.25,
        description: 'Profundidad de trabajo en metros (opcional)',
      },
      work_type: {
        type: 'string',
        enum: ['tillage', 'planting', 'harvesting', 'transport', 'general'],
        example: 'tillage',
        description: 'Tipo de trabajo agrícola',
      },
    },
  },

  RecommendationResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Recomendaciones generadas exitosamente' },
      data: {
        type: 'object',
        properties: {
          queryId: { type: 'integer', example: 10 },
          implement: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              brand: { type: 'string' },
              type: { type: 'string' },
            },
          },
          terrain: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              soil_type: { type: 'string' },
              slope_percentage: { type: 'number', format: 'float' },
            },
          },
          powerRequirement: {
            type: 'object',
            properties: {
              minimum_power_hp: { type: 'number', format: 'float' },
              factors: { type: 'object' },
            },
          },
          terrainAnalysis: {
            type: 'object',
            description: 'Análisis detallado del terreno (clasificación de pendiente, tipo de suelo)',
          },
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                rank: { type: 'integer', example: 1 },
                tractor: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    name: { type: 'string', example: 'John Deere 6130M' },
                    brand: { type: 'string', example: 'John Deere' },
                    model: { type: 'string', example: '6130M' },
                    engine_power_hp: { type: 'number', format: 'float', example: 130.0 },
                    traction_type: { type: 'string', example: '4x4' },
                    weight_kg: { type: 'number', format: 'float', example: 5200.0 },
                  },
                },
                score: {
                  type: 'object',
                  properties: {
                    total: { type: 'number', format: 'float', example: 87.5 },
                    breakdown: { type: 'object' },
                  },
                },
                compatibility: { type: 'object' },
                classification: {
                  type: 'object',
                  properties: {
                    label: { type: 'string', enum: ['OPTIMAL', 'GOOD', 'ACCEPTABLE', 'OVERPOWERED'] },
                  },
                },
                explanation: {
                  type: 'string',
                  example: 'Alta eficiencia energética (85% utilización). Ajuste óptimo de potencia.',
                },
              },
            },
          },
          summary: { type: 'object', description: 'Resumen estadístico de las recomendaciones' },
        },
      },
    },
  },

  RecommendationHistory: {
    type: 'object',
    properties: {
      recommendation_id: { type: 'integer', example: 1 },
      user_id: { type: 'integer', example: 1 },
      terrain_id: { type: 'integer', example: 1 },
      tractor_id: { type: 'integer', example: 3, nullable: true },
      implement_id: { type: 'integer', example: 2, nullable: true },
      compatibility_score: { type: 'number', format: 'float', example: 87.5, nullable: true },
      observations: { type: 'string', nullable: true },
      work_type: { type: 'string', example: 'tillage', nullable: true },
      recommendation_date: { type: 'string', format: 'date-time' },
      terrain_name: { type: 'string', example: 'Parcela Norte' },
      soil_type: { type: 'string', example: 'clay' },
      tractor_name: { type: 'string', example: 'John Deere 6130M', nullable: true },
      tractor_brand: { type: 'string', example: 'John Deere', nullable: true },
      implement_name: { type: 'string', example: 'Arado de discos', nullable: true },
      implement_type: { type: 'string', example: 'plow', nullable: true },
    },
  },

  // ==========================================
  // ROLE SCHEMAS
  // ==========================================
  Role: {
    type: 'object',
    properties: {
      role_id: { type: 'integer', example: 1 },
      role_name: { type: 'string', example: 'admin' },
      description: { type: 'string', example: 'Administrador del sistema', nullable: true },
      status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    },
  },

  RoleCreate: {
    type: 'object',
    required: ['role_name'],
    properties: {
      role_name: {
        type: 'string',
        minLength: 2,
        example: 'moderator',
        description: 'Nombre del rol (mín. 2 caracteres)',
      },
      description: {
        type: 'string',
        example: 'Moderador del sistema',
        description: 'Descripción del rol (opcional)',
      },
    },
  },

  RoleUpdate: {
    type: 'object',
    properties: {
      role_name: {
        type: 'string',
        minLength: 2,
        example: 'moderator_updated',
      },
      description: {
        type: 'string',
        example: 'Descripción actualizada',
      },
      status: {
        type: 'string',
        enum: ['active', 'inactive'],
      },
    },
  },
};
