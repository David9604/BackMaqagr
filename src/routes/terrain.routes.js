import { Router } from "express";
import {
  getAllTerrains,
  getTerrainById,
  createTerrain,
  updateTerrain,
  deleteTerrain,
} from "../controllers/terrainController.js";
import { verifyTokenMiddleware } from "../middleware/auth.middleware.js";

import { cacheMiddleware, invalidateCacheMiddleware } from "../middleware/cache.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
// Los usuarios solo pueden ver/editar/eliminar sus propios terrenos

router.get("/", verifyTokenMiddleware, cacheMiddleware(300), getAllTerrains);
router.get("/:id", verifyTokenMiddleware, getTerrainById);
router.post("/", verifyTokenMiddleware, invalidateCacheMiddleware('*terrains*'), createTerrain);
router.put("/:id", verifyTokenMiddleware, invalidateCacheMiddleware(['*terrains*', '*recommendations*']), updateTerrain);
router.delete("/:id", verifyTokenMiddleware, invalidateCacheMiddleware(['*terrains*', '*recommendations*']), deleteTerrain);

export default router;
