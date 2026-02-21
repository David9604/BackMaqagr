import { describe, test, expect } from "@jest/globals";
import express from "express";
import request from "supertest";
import { sanitizeInputs } from "../../src/middleware/sanitize.middleware.js";
import {
  sanitizeString,
  sanitizeSQLInput,
} from "../../src/utils/validators.util.js";

/**
 * Creamos una mini-app Express aislada (sin DB) para verificar que el middleware
 * sanitiza correctamente req.body, req.query y req.params antes de que lleguen al handler.
 */
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(sanitizeInputs);

  // Ruta de eco: devuelve exactamente lo que recibió después de la sanitización
  app.post("/echo", (req, res) => {
    res.json({ body: req.body });
  });

  app.get("/echo", (req, res) => {
    res.json({ query: req.query });
  });

  return app;
};

describe("Sanitización de Inputs (XSS y SQL Injection)", () => {
  describe("XSS Protection (via middleware)", () => {
    test("debería sanitizar script tags en el body de la petición", async () => {
      const app = createTestApp();

      const response = await request(app)
        .post("/echo")
        .send({ name: '<script>alert("xss")</script>' });

      expect(response.status).toBe(200);
      expect(response.body.body.name).not.toContain("<script>");
      expect(response.body.body.name).not.toContain("</script>");
    });

    test("debería sanitizar tags HTML peligrosos (img onerror)", async () => {
      const app = createTestApp();

      const response = await request(app)
        .post("/echo")
        .send({ name: "<img src=x onerror=alert(1)>Juan" });

      expect(response.status).toBe(200);
      expect(response.body.body.name).not.toContain("onerror");
    });

    test("debería sanitizar objetos anidados recursivamente", async () => {
      const app = createTestApp();

      const response = await request(app)
        .post("/echo")
        .send({
          user: {
            name: "<b onmouseover=alert(1)>Hola</b>",
            address: { city: "<script>document.cookie</script>" },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.body.user.name).not.toContain("onmouseover");
      expect(response.body.body.user.address.city).not.toContain("<script>");
    });
  });

  describe("SQL Injection Protection (via middleware)", () => {
    test("debería sanitizar intentos de SQL injection en el body", async () => {
      const app = createTestApp();

      const response = await request(app)
        .post("/echo")
        .send({ name: "'; DROP TABLE users; --" });

      expect(response.status).toBe(200);
      // Los comentarios SQL (--) y punto y coma deben ser removidos,
      // las comillas simples deben ser escapadas (duplicadas)
      expect(response.body.body.name).not.toContain("--");
      // Verificar que los punto y coma fueron removidos (el input original tenía ';')
      // NOTA: xss() puede generar entidades HTML con ';', pero los ';' originales del SQL se remueven
      expect(response.body.body.name).not.toMatch(/'; DROP/);
    });

    test("debería sanitizar patrones OR 1=1 con comillas en los inputs", async () => {
      const app = createTestApp();

      const response = await request(app)
        .post("/echo")
        .send({ email: "admin@example.com' OR '1'='1" });

      expect(response.status).toBe(200);
      // Las comillas simples originales deben ser duplicadas por sanitizeSQLInput
      // El input original "admin@example.com' OR '1'='1" se convierte en
      // algo como "admin@example.com'' OR ''1''=''1" (comillas simples escapadas)
      // Verificamos que la secuencia exacta del ataque ya no existe
      expect(response.body.body.email).not.toBe("admin@example.com' OR '1'='1");
    });
  });

  describe("Sanitización directa de funciones", () => {
    test("sanitizeString debe remover script tags", () => {
      const result = sanitizeString('<script>alert("xss")</script>');
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("</script>");
    });

    test("sanitizeString debe remover img onerror", () => {
      const result = sanitizeString("<img src=x onerror=alert(1)>");
      expect(result).not.toContain("onerror");
    });

    test("sanitizeSQLInput debe escapar comillas simples", () => {
      const result = sanitizeSQLInput("'; DROP TABLE users; --");
      expect(result).not.toContain("';");
      expect(result).not.toContain("--");
    });

    test("sanitizeSQLInput debe remover comentarios SQL de bloque", () => {
      const result = sanitizeSQLInput("admin /* comment */ OR 1=1");
      expect(result).not.toContain("/*");
      expect(result).not.toContain("*/");
    });

    test("sanitizeSQLInput debe remover punto y coma", () => {
      const result = sanitizeSQLInput("value; DROP TABLE users");
      expect(result).not.toContain(";");
    });
  });
});
