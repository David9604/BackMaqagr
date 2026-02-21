import { describe, test, expect } from "@jest/globals";
import express from "express";
import request from "supertest";
import rateLimit from "express-rate-limit";

/**
 * Creamos mini-apps Express aisladas con límites reducidos
 * para poder probar el rate limiting sin hacer 50+ peticiones.
 */
const createLimitedApp = (max, windowMs = 15 * 60 * 1000) => {
  const app = express();

  const limiter = rateLimit({
    windowMs,
    max,
    message: { success: false, message: "Límite excedido" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(limiter);
  app.get("/test", (req, res) => res.json({ success: true }));
  app.post("/test", (req, res) => res.json({ success: true }));

  return app;
};

describe("Rate Limiter Middleware", () => {
  test("debe permitir peticiones dentro del límite", async () => {
    const app = createLimitedApp(5);

    const response = await request(app).get("/test");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("debe bloquear peticiones después de exceder el límite", async () => {
    const app = createLimitedApp(3);

    // Hacer 3 peticiones (el límite)
    for (let i = 0; i < 3; i++) {
      await request(app).get("/test");
    }

    // La petición número 4 debe ser bloqueada
    const response = await request(app).get("/test");
    expect(response.status).toBe(429);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Límite excedido");
  });

  test("debe retornar headers estándar de rate limiting (RateLimit-*)", async () => {
    const app = createLimitedApp(10);

    const response = await request(app).get("/test");

    // express-rate-limit v7+ usa headers estándar (RFC draft)
    expect(response.headers["ratelimit-limit"]).toBeDefined();
    expect(response.headers["ratelimit-remaining"]).toBeDefined();
    expect(response.headers["ratelimit-reset"]).toBeDefined();
  });

  test("debe decrementar el contador de peticiones restantes", async () => {
    const app = createLimitedApp(5);

    const res1 = await request(app).get("/test");
    const remaining1 = parseInt(res1.headers["ratelimit-remaining"]);

    const res2 = await request(app).get("/test");
    const remaining2 = parseInt(res2.headers["ratelimit-remaining"]);

    expect(remaining2).toBe(remaining1 - 1);
  });

  test("debe aplicar el límite independientemente del método HTTP", async () => {
    const app = createLimitedApp(2);

    // 1 GET + 1 POST = 2 peticiones (el límite)
    await request(app).get("/test");
    await request(app).post("/test");

    // La tercera petición (independientemente del método) debe ser bloqueada
    const response = await request(app).get("/test");
    expect(response.status).toBe(429);
  });

  test("debe devolver status 429 con body en formato JSend cuando se excede", async () => {
    const app = createLimitedApp(1);

    await request(app).get("/test"); // Consume el único intento

    const response = await request(app).get("/test");
    expect(response.status).toBe(429);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty("message");
    expect(typeof response.body.message).toBe("string");
  });
});
