import { describe, test, expect } from "@jest/globals";
import request from "supertest";
import app from "../../src/app.js";

describe("Security Headers (Helmet)", () => {
  test("debería retornar headers de seguridad en las peticiones", async () => {
    const response = await request(app).get("/");

    // Verificar que X-Powered-By fue removido por Helmet
    expect(response.headers["x-powered-by"]).toBeUndefined();

    // Verificar headers específicos configurados en security.middleware.js
    expect(response.headers["x-frame-options"]).toBe("DENY");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["strict-transport-security"]).toBeDefined();

    // Content Security Policy
    // En las versiones recientes de Helmet, CSP se envía en un solo header. Validaremos algunas de sus directivas
    expect(response.headers["content-security-policy"]).toContain(
      "default-src 'self'",
    );
    expect(response.headers["content-security-policy"]).toContain(
      "frame-ancestors 'self'",
    );
  });
});
