import cors from "cors";
import logger from "../utils/logger.js"; // Opcional, pero bueno para depurar orígenes rechazados

/**
 * Middleware de configuración dinámica de CORS.
 * Las políticas de acceso cambian dependiendo del entorno (NODE_ENV).
 */
const getCorsOptions = () => {
  const env = process.env.NODE_ENV || "development";

  // Definición de orígenes permitidos por entorno
  const allowedOrigins = {
    development: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
    ],
    staging: [process.env.STAGING_CLIENT_URL || "https://staging.maqagr.com"],
    production: [process.env.PROD_CLIENT_URL || "https://app.maqagr.com"],
  };

  const origins = allowedOrigins[env] || allowedOrigins.development;

  return {
    origin: (origin, callback) => {
      // Permitir peticiones sin origin (como de Postman, curl, S2S) o si está en la lista blanca
      if (!origin || origins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // En lugar de usar logger aquí que causaría dependencia circular si app invoca a logger
        callback(new Error("No permitido por la política CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
};

export const corsMiddleware = cors(getCorsOptions());
