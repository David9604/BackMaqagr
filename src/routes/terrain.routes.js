import { Router } from "express";
import {
  getAllTerrains,
  getTerrainById,
  createTerrain,
  updateTerrain,
  deleteTerrain,
} from "../controllers/terrainController.js";
import { verifyTokenMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
// Los usuarios solo pueden ver/editar/eliminar sus propios terrenos

router.get("/", verifyTokenMiddleware, getAllTerrains);
router.get("/:id", verifyTokenMiddleware, getTerrainById);
router.post("/", verifyTokenMiddleware, createTerrain);
router.put("/:id", verifyTokenMiddleware, updateTerrain);
router.delete("/:id", verifyTokenMiddleware, deleteTerrain);

export default router;
