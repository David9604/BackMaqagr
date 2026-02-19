/**
 * DDAAM-112: Health Check Controller
 * GET /health           → status público rápido
 * GET /health/detailed  → diagnóstico completo (solo admin)
 */

import { pool } from '../config/db.js';
import logger from '../config/logger.js';
import { asyncHandler } from '../utils/asyncHandler.util.js';

// Fecha de inicio del proceso (para uptime)
const startTime = Date.now();

// ---------------------------------------------------------------------------
// GET /health
// ---------------------------------------------------------------------------

/**
 * Respuesta liviana, sin llamadas externas.
 * Útil para load-balancers y health checks de contenedores.
 */
export const getHealth = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// GET /health/detailed  (requiere isAdmin middleware)
// ---------------------------------------------------------------------------

/**
 * Diagnóstico completo: DB, memoria, CPU, uptime.
 * Se devuelve 200 si todos los servicios están bien, 503 si alguno falla.
 */
export const getHealthDetailed = asyncHandler(async (req, res) => {
  const checks = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {},
    system: {},
  };

  // ── Database ──────────────────────────────────────────────────────────────
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    const latency = Date.now() - start;
    checks.services.database = { status: 'connected', latencyMs: latency };
  } catch (err) {
    checks.status = 'degraded';
    checks.services.database = { status: 'disconnected', error: err.message };
    logger.error('Health check: database unreachable', { error: err.message, stack: err.stack });
  }

  // ── Redis (placeholder — no instalado aún) ────────────────────────────────
  checks.services.redis = { status: 'disconnected', note: 'not configured' };

  // ── System metrics ────────────────────────────────────────────────────────
  checks.system.memory = process.memoryUsage();
  checks.system.cpuUsage = process.cpuUsage();
  checks.system.nodeVersion = process.version;
  checks.system.platform = process.platform;

  const httpStatus = checks.status === 'ok' ? 200 : 503;
  res.status(httpStatus).json(checks);
});
