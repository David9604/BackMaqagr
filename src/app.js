import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./config/db.js";
import calculationRoutes from "./routes/calculation.routes.js";
import tractorRoutes from "./routes/tractor.routes.js";
import implementRoutes from "./routes/implement.routes.js";
import terrainRoutes from "./routes/terrain.routes.js";
import authRoutes from "./routes/auth.routes.js";
import roleRoutes from "./routes/role.routes.js";
import recommendationRoutes from "./routes/recommendation.routes.js";
import logger from "./utils/logger.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";

dotenv.config();
const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(logger.requestLogger);

// Ruta principal
app.get("/", (req, res) => res.send("API de tractores funcionando 🚜"));

// Documentación Swagger
setupSwagger(app);
=======
>>>>>>> origin/testing/DDAAM-80-Tests-E2E-y-Middleware

// Rutas de autenticación
app.use("/api/auth", authRoutes);

// Rutas de cálculos de potencia (semántica REST)
app.use("/api/calculations", calculationRoutes);

// Rutas de roles
app.use("/api/roles", roleRoutes);

// Rutas de recomendaciones
app.use("/api/recommendations", recommendationRoutes);

// Rutas de terrenos
app.use("/api/terrains", terrainRoutes);

// Rutas de implementos
app.use("/api/implements", implementRoutes);

// Rutas de tractores
app.use("/api/tractors", tractorRoutes);

// Middleware de manejo de errores (DEBE IR AL FINAL)
app.use(notFound);
app.use(errorHandler);

<<<<<<< HEAD
// Solo iniciar servidor si no estamos en modo test (supertest maneja su propio servidor)
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    logger.info(`🚜 Servidor corriendo en puerto ${PORT}`);
    logger.info(`📡 Ambiente: ${process.env.NODE_ENV || "development"}`);
  });
}
=======
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  logger.info(`🚜 Servidor corriendo en puerto ${PORT}`);
  logger.info(`📡 Ambiente: ${process.env.NODE_ENV || "development"}`);
});
>>>>>>> origin/testing/DDAAM-80-Tests-E2E-y-Middleware

export default app;
