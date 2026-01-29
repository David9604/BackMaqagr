import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/db.js';
import calculationRoutes from './routes/calculationRoutes.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.get('/', (req, res) => res.send('API de tractores funcionando 🚜'));
app.use('/api', calculationRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));

export default app;
