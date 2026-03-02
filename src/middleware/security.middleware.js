import helmet from "helmet";

/**
 * Middleware para configurar headers de seguridad HTTP usando Helmet.
 * Incluye Content Security Policy (CSP), protección XSS, HSTS, etc.
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"], // Equivalente a X-Frame-Options: DENY/SAMEORIGIN mejorado
      imgSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Permitir recursos cross-origin si es necesario
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" }, // X-Frame-Options: DENY
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true, // X-Content-Type-Options: nosniff
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true, // X-XSS-Protection
});

export default securityHeaders;
