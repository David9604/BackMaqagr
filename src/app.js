import express from "express";
// Eliminamos import cors from "cors", ya que se usa corsMiddleware;
import dotenv from "dotenv";
import { pool } from "./config/db.js";
import calculationRoutes from "./routes/calculation.routes.js";
import tractorRoutes from "./routes/tractor.routes.js";
import implementRoutes from "./routes/implement.routes.js";
import terrainRoutes from "./routes/terrain.routes.js";
import authRoutes from "./routes/auth.routes.js";
import roleRoutes from "./routes/role.routes.js";
import recommendationRoutes from "./routes/recommendation.routes.js";
import { setupSwagger } from "./swagger/swagger.js";

import logger from "./utils/logger.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";

import { securityHeaders } from "./middleware/security.middleware.js";
import { apiLimiter } from "./middleware/rateLimiter.middleware.js";
import { corsMiddleware } from "./middleware/cors.middleware.js";
import { sanitizeInputs } from "./middleware/sanitize.middleware.js";

dotenv.config();
const app = express();

// Trust proxy if we are behind a reverse proxy (e.g., Heroku, Nginx)
app.set("trust proxy", 1);

// Middlewares globales
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(express.json());
app.use(sanitizeInputs);
app.use(logger.requestLogger);

// Ruta principal
app.get("/", (req, res) => res.send("API de tractores funcionando 🚜"));

// Documentación Swagger
setupSwagger(app);

// Rutas de autenticación
app.use("/api/auth", authRoutes);

// Aplicar el apiLimiter general a las rutas de dominio principales (excepto auth que ya tiene sus limitadores más estrictos)
app.use("/api/calculations", apiLimiter, calculationRoutes);
app.use("/api/roles", apiLimiter, roleRoutes);
app.use("/api/recommendations", apiLimiter, recommendationRoutes);
app.use("/api/terrains", apiLimiter, terrainRoutes);
app.use("/api/implements", apiLimiter, implementRoutes);
app.use("/api/tractors", apiLimiter, tractorRoutes);

// Middleware de manejo de errores (DEBE IR AL FINAL)
app.use(notFound);
app.use(errorHandler);

// Solo iniciar servidor si no estamos en modo test (supertest maneja su propio servidor)
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    logger.info(`🚜 Servidor corriendo en puerto ${PORT}`);
    logger.info(`📡 Ambiente: ${process.env.NODE_ENV || "development"}`);
  });
}

export default app;
