import request from "supertest";
import app from "../../src/app.js";
import { describe, test, expect } from "@jest/globals";

describe("Security Headers", () => {
  test("debe incluir headers de seguridad básicos (Helmet)", async () => {
    const res = await request(app).get("/");

    // X-DNS-Prefetch-Control
    expect(res.headers["x-dns-prefetch-control"]).toBe("off");

    // X-Frame-Options
    expect(res.headers["x-frame-options"]).toBe("DENY");

    // X-Content-Type-Options
    expect(res.headers["x-content-type-options"]).toBe("nosniff");

    // Strict-Transport-Security (HSTS)
    expect(res.headers["strict-transport-security"]).toBe(
      "max-age=31536000; includeSubDomains; preload",
    );

    // Content-Security-Policy (CSP)
    expect(res.headers["content-security-policy"]).toBeDefined();
    expect(res.headers["content-security-policy"]).toContain(
      "default-src 'self'",
    );
  });

  test("no debe revelar tecnología del servidor (X-Powered-By oculto)", async () => {
    const res = await request(app).get("/");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});
