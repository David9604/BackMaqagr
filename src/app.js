import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/db.js';
import tractorRoutes from './routes/tractor.routes.js';
import implementRoutes from './routes/implement.routes.js';
import authRoutes from './routes/auth.routes.js';
import roleRoutes from './routes/role.routes.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de roles
app.use('/api/roles', roleRoutes);

app.get('/', (req, res) => res.send('API de tractores funcionando 🚜'));

// Rutas públicas
app.use('/api/tractors', tractorRoutes);
app.use('/api/implements', implementRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
