import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const baseModelOptions = {
  timestamps: false,
  freezeTableName: true,
};

export const AnalyticsUser = sequelize.define(
  'AnalyticsUser',
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    status: DataTypes.STRING,
    registration_date: DataTypes.DATE,
  },
  {
    ...baseModelOptions,
    tableName: 'users',
  },
);

export const AnalyticsTractor = sequelize.define(
  'AnalyticsTractor',
  {
    tractor_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    brand: DataTypes.STRING,
    model: DataTypes.STRING,
    engine_power_hp: DataTypes.DOUBLE,
    model_year: DataTypes.INTEGER,
    price: DataTypes.DOUBLE,
  },
  {
    ...baseModelOptions,
    tableName: 'tractor',
  },
);

export const AnalyticsImplement = sequelize.define(
  'AnalyticsImplement',
  {
    implement_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    implement_name: DataTypes.STRING,
    brand: DataTypes.STRING,
    implement_type: DataTypes.STRING,
  },
  {
    ...baseModelOptions,
    tableName: 'implement',
  },
);

export const AnalyticsTerrain = sequelize.define(
  'AnalyticsTerrain',
  {
    terrain_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    user_id: DataTypes.INTEGER,
    soil_type: DataTypes.STRING,
  },
  {
    ...baseModelOptions,
    tableName: 'terrain',
  },
);

export const AnalyticsQuery = sequelize.define(
  'AnalyticsQuery',
  {
    query_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    user_id: DataTypes.INTEGER,
    query_date: DataTypes.DATE,
  },
  {
    ...baseModelOptions,
    tableName: 'query',
  },
);

export const AnalyticsRecommendation = sequelize.define(
  'AnalyticsRecommendation',
  {
    recommendation_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    user_id: DataTypes.INTEGER,
    terrain_id: DataTypes.INTEGER,
    tractor_id: DataTypes.INTEGER,
    implement_id: DataTypes.INTEGER,
    recommendation_date: DataTypes.DATE,
  },
  {
    ...baseModelOptions,
    tableName: 'recommendation',
  },
);

AnalyticsRecommendation.belongsTo(AnalyticsTractor, {
  foreignKey: 'tractor_id',
  as: 'tractor',
});

AnalyticsRecommendation.belongsTo(AnalyticsImplement, {
  foreignKey: 'implement_id',
  as: 'implement',
});

AnalyticsRecommendation.belongsTo(AnalyticsTerrain, {
  foreignKey: 'terrain_id',
  as: 'terrain',
});

AnalyticsRecommendation.belongsTo(AnalyticsUser, {
  foreignKey: 'user_id',
  as: 'user',
});

AnalyticsQuery.belongsTo(AnalyticsUser, {
  foreignKey: 'user_id',
  as: 'user',
});

AnalyticsTerrain.belongsTo(AnalyticsUser, {
  foreignKey: 'user_id',
  as: 'user',
});

export default {
  AnalyticsUser,
  AnalyticsTractor,
  AnalyticsImplement,
  AnalyticsTerrain,
  AnalyticsQuery,
  AnalyticsRecommendation,
};
