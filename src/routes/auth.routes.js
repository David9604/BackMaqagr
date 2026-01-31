/**
 * Rutas de Autenticación
 * Endpoints públicos y protegidos para auth
 */

import { Router } from 'express';
import {
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    changePassword
} from '../controllers/authController.js';
import { verifyTokenMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// ==================== RUTAS PÚBLICAS ====================

// POST /api/auth/register - Registro de nuevos usuarios
router.post('/register', register);

// POST /api/auth/login - Inicio de sesión
router.post('/login', login);

// ==================== RUTAS PROTEGIDAS ====================

// POST /api/auth/logout - Cierre de sesión (requiere autenticación)
router.post('/logout', verifyTokenMiddleware, logout);

// GET /api/auth/profile - Obtener datos del perfil del usuario autenticado
router.get('/profile', verifyTokenMiddleware, getProfile);

// PUT /api/auth/profile - Actualizar nombre y email del usuario autenticado
router.put('/profile', verifyTokenMiddleware, updateProfile);

// PUT /api/auth/password - Cambiar contraseña del usuario autenticado
router.put('/password', verifyTokenMiddleware, changePassword);

export default router;
