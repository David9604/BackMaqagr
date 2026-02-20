import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import app from "../../src/app.js";
import {
  loginLimiter,
  publicLimiter,
} from "../../src/middleware/rateLimiter.middleware.js";

describe("Rate Limiter Middleware", () => {
  describe("loginLimiter", () => {
    test("debe bloquear peticiones después del límite (5 intentos)", async () => {
      // Hacer 5 peticiones (el límite) usando credenciales falsas
      for (let i = 0; i < 5; i++) {
        await request(app).post("/api/auth/login").send({
          email: "test@example.com",
          password: "Password123",
        });
      }

      // La petición número 6 debe ser bloqueada
      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "Password123",
      });

      expect(response.status).toBe(429);
      expect(response.body).toEqual({
        success: false,
        message:
          "Demasiados intentos de inicio de sesión. Por favor, intente de nuevo en 15 minutos.",
      });
    });
  });

  describe("publicLimiter", () => {
    test("debe bloquear registro después del límite (50 peticiones)", async () => {
      // Configuraremos un mock para limitador si quisiéramos no tener que hacer 50 peticiones,
      // pero para la prueba fidedigna en Jest E2E, se pueden hacer rápidamente las llamadas al registro.
      // Ya que no queremos llenar la BD de registros por test, se envía una petición con datos incompletos
      // que falla por validación (400), pero aún así contabiliza en el limiter

      const reqPromises = [];
      for (let i = 0; i < 50; i++) {
        reqPromises.push(request(app).post("/api/auth/register").send({}));
      }
      await Promise.all(reqPromises);

      // La petición 51 debe ser bloqueada por rate-limiter
      const response = await request(app).post("/api/auth/register").send({});

      expect(response.status).toBe(429);
      expect(response.body).toEqual({
        success: false,
        message:
          "Demasiadas peticiones desde esta IP, por favor intente más tarde.",
      });
    });
  });
});
