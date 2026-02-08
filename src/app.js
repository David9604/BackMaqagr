import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/db.js';
import calculationRoutes from './routes/calculation.routes.js';
import tractorRoutes from './routes/tractor.routes.js';
import implementRoutes from './routes/implement.routes.js';
import terrainRoutes from './routes/terrain.routes.js';
import authRoutes from './routes/auth.routes.js';
import roleRoutes from './routes/role.routes.js';
import recommendationRoutes from './routes/recommendation.routes.js';
import terrainRoutes from './routes/terrain.routes.js';
import implementRoutes from './routes/implement.routes.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Ruta principal
app.get('/', (req, res) => res.send('API de tractores funcionando 🚜'));

// Rutas de autenticación
app.use("/api/auth", authRoutes);

// Rutas de roles
app.use('/api/roles', roleRoutes);

// Rutas de cálculos de potencia (semántica REST)
app.use('/api/calculations', calculationRoutes);
// Rutas de roles
app.use('/api/roles', roleRoutes);
// Rutas de recomendaciones
app.use('/api/recommendations', recommendationRoutes);
// Rutas de terrenos
app.use('/api/terrains', terrainRoutes);
// Rutas de implementos
app.use('/api/implements', implementRoutes);

app.get('/', (req, res) => res.send('API de tractores funcionando 🚜'));

// Rutas públicas y protegidas
app.use("/api/tractors", tractorRoutes);
app.use("/api/implements", implementRoutes);
app.use("/api/terrains", terrainRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));

export default app;
