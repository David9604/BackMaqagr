import { describe, test, expect } from "@jest/globals";
import request from "supertest";
import app from "../../src/app.js";

describe("Security Headers (Helmet)", () => {
  let response;

  // Reutilizar la misma respuesta para evitar múltiples peticiones innecesarias
  beforeAll(async () => {
    response = await request(app).get("/");
  });

  test("debería ocultar X-Powered-By para no revelar tecnología del servidor", () => {
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });

  test("debería incluir X-Frame-Options: DENY para prevenir clickjacking", () => {
    expect(response.headers["x-frame-options"]).toBe("DENY");
  });

  test("debería incluir X-Content-Type-Options: nosniff para prevenir MIME sniffing", () => {
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
  });

  test("debería incluir HSTS con max-age de 1 año, includeSubDomains y preload", () => {
    const hsts = response.headers["strict-transport-security"];
    expect(hsts).toBeDefined();
    expect(hsts).toContain("max-age=31536000");
    expect(hsts).toContain("includeSubDomains");
    expect(hsts).toContain("preload");
  });

  test("debería incluir Content-Security-Policy con directivas seguras", () => {
    const csp = response.headers["content-security-policy"];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'self'");
  });

  test("debería incluir X-DNS-Prefetch-Control: off", () => {
    expect(response.headers["x-dns-prefetch-control"]).toBe("off");
  });

  test("debería incluir Referrer-Policy seguro", () => {
    expect(response.headers["referrer-policy"]).toBe(
      "strict-origin-when-cross-origin",
    );
  });
});
