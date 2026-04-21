/**
 * Rutas de Autenticación
 * Endpoints públicos y protegidos para auth
 */

import { Router } from "express";
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  deleteUser,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import {
  verifyTokenMiddleware,
  isAdmin,
} from "../middleware/auth.middleware.js";
import {
  loginLimiter,
  publicLimiter,
} from "../middleware/rateLimiter.middleware.js";

const router = Router();

// ==================== RUTAS PÚBLICAS ====================

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     description: |
 *       Crea una nueva cuenta de usuario en el sistema.
 *       El usuario se crea con rol "user" (role_id: 2) por defecto.
 *       La contraseña debe cumplir requisitos de seguridad (mín. 8 caracteres, mayúscula, minúscula, número y carácter especial).
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegister'
 *           example:
 *             name: "Juan Pérez"
 *             email: "juan@example.com"
 *             password: "MiPassword123!"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               token: "eyJhbGciOiJIUzI1NiIs..."
 *               user:
 *                 id: 1
 *                 name: "Juan Pérez"
 *                 email: "juan@example.com"
 *               role: "user"
 *               role_id: 2
 *       400:
 *         description: Datos de entrada inválidos o contraseña débil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               camposFaltantes:
 *                 summary: Campos requeridos faltantes
 *                 value:
 *                   success: false
 *                   code: "VALIDATION_ERROR"
 *                   message: "Datos de entrada incompletos"
 *                   errors: ["Nombre es requerido", "Email es requerido"]
 *               emailInvalido:
 *                 summary: Formato de email inválido
 *                 value:
 *                   success: false
 *                   code: "VALIDATION_ERROR"
 *                   message: "Formato de email inválido"
 *               passwordDebil:
 *                 summary: Contraseña no cumple requisitos
 *                 value:
 *                   success: false
 *                   code: "VALIDATION_ERROR"
 *                   message: "Contraseña no cumple requisitos"
 *                   errors: ["Debe tener al menos 8 caracteres", "Debe incluir una mayúscula"]
 *       409:
 *         description: Email ya registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: "USER_ALREADY_EXISTS"
 *               message: "El email ya está registrado"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/register", publicLimiter, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: |
 *       Autentica un usuario con email y contraseña.
 *       Retorna un token JWT que debe usarse en el header Authorization para endpoints protegidos.
 *       Actualiza automáticamente el campo `last_session` del usuario.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *           example:
 *             email: "juan@example.com"
 *             password: "MiPassword123!"
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             example:
 *               token: "eyJhbGciOiJIUzI1NiIs..."
 *               user:
 *                 id: 1
 *                 name: "Juan Pérez"
 *                 email: "juan@example.com"
 *               role: "user"
 *               role_id: 2
 *       400:
 *         description: Email y contraseña son requeridos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: "VALIDATION_ERROR"
 *               message: "Email y contraseña son requeridos"
 *       401:
 *         description: Credenciales inválidas o usuario inactivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               credencialesInvalidas:
 *                 summary: Email o contraseña incorrectos
 *                 value:
 *                   success: false
 *                   code: "INVALID_CREDENTIALS"
 *                   message: "Credenciales inválidas"
 *               usuarioInactivo:
 *                 summary: Usuario suspendido o inactivo
 *                 value:
 *                   success: false
 *                   code: "UNAUTHORIZED"
 *                   message: "Usuario inactivo o suspendido"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/login", loginLimiter, login);

// ==================== RECUPERACIÓN DE CONTRASEÑA ====================

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Solicitar restablecimiento de contraseña
 *     description: |
 *       Genera un token JWT de un solo uso (1h expiración) para restablecer la contraseña.
 *       El token se incluye en la respuesta para uso directo en este entorno.
 *       En producción se enviaría por email y NO se incluiría en la respuesta.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@maqagr.com"
 *     responses:
 *       200:
 *         description: Si el email está registrado, se genera un token de restablecimiento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Si el email está registrado, recibirás instrucciones para restablecer tu contraseña"
 *                 resetToken:
 *                   type: string
 *                   description: Token JWT para restablecer contraseña (solo en entorno de desarrollo)
 *       400:
 *         description: Email faltante o inválido
 *       500:
 *         description: Error interno del servidor
 */
router.post("/forgot-password", publicLimiter, forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Restablecer contraseña con token
 *     description: |
 *       Verifica el token de restablecimiento y actualiza la contraseña del usuario.
 *       La nueva contraseña debe cumplir requisitos de seguridad (mín. 8 caracteres, mayúscula, número).
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token JWT obtenido de /api/auth/forgot-password
 *                 example: "eyJhbGciOiJIUzI1NiIs..."
 *               newPassword:
 *                 type: string
 *                 description: Nueva contraseña que cumple requisitos de seguridad
 *                 example: "NuevaPassword456!"
 *     responses:
 *       200:
 *         description: Contraseña restablecida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Datos faltantes o contraseña débil
 *       401:
 *         description: Token inválido o expirado
 */
router.post("/reset-password", publicLimiter, resetPassword);

// ==================== RUTAS PROTEGIDAS ====================

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     description: |
 *       Cierra la sesión del usuario autenticado.
 *       Nota: JWT es stateless, este endpoint solo retorna confirmación.
 *       El token debe ser descartado del lado del cliente.
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Sesión cerrada exitosamente"
 *               data: null
 *       401:
 *         description: Token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/logout", verifyTokenMiddleware, logout);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     description: Retorna los datos completos del perfil del usuario autenticado (sin contraseña).
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Perfil obtenido exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/profile", verifyTokenMiddleware, getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Actualizar perfil del usuario autenticado
 *     description: |
 *       Permite actualizar el nombre y/o email del usuario autenticado.
 *       No permite cambiar el rol ni el status. Al menos un campo debe ser proporcionado.
 *       Si se actualiza el email, se verifica que no esté en uso por otro usuario.
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfile'
 *           example:
 *             name: "Juan Pérez Actualizado"
 *             email: "nuevo@example.com"
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Perfil actualizado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Datos inválidos o email con formato incorrecto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email ya en uso por otro usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "El email ya está en uso por otro usuario"
 */
router.put("/profile", verifyTokenMiddleware, updateProfile);

/**
 * @swagger
 * /api/auth/password:
 *   put:
 *     summary: Cambiar contraseña
 *     description: |
 *       Permite al usuario autenticado cambiar su contraseña.
 *       Requiere la contraseña actual para verificación.
 *       La nueva contraseña debe cumplir requisitos de seguridad.
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePassword'
 *           example:
 *             currentPassword: "MiPasswordActual123!"
 *             newPassword: "NuevaPassword456!"
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Contraseña actualizada exitosamente"
 *               data: null
 *       400:
 *         description: Datos faltantes o contraseña débil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Contraseña actual incorrecta o token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "La contraseña actual es incorrecta"
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/password", verifyTokenMiddleware, changePassword);

/**
 * @swagger
 * /api/auth/users/{id}:
 *   delete:
 *     summary: Eliminar usuario (Admin)
 *     description: |
 *       Elimina un usuario del sistema por su ID.
 *       Verifica que el usuario no tenga terrenos asociados antes de eliminar.
 *       Solo accesible por administradores.
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario a eliminar
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *       400:
 *         description: El usuario tiene terrenos asociados
 *       404:
 *         description: Usuario no encontrado
 */
router.delete("/users/:id", verifyTokenMiddleware, isAdmin, deleteUser);

export default router;
