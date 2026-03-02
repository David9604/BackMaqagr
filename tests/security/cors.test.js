import { describe, test, expect } from "@jest/globals";
import request from "supertest";
import app from "../../src/app.js";

describe("CORS Middleware", () => {
  test("debería permitir preflight desde localhost:3000 (development)", async () => {
    const response = await request(app)
      .options("/api/tractors")
      .set("Origin", "http://localhost:3000")
      .set("Access-Control-Request-Method", "GET");

    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000",
    );
  });

  test("debería permitir preflight desde localhost:5173 (Vite dev server)", async () => {
    const response = await request(app)
      .options("/api/tractors")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "POST");

    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173",
    );
  });

  test("debería bloquear orígenes NO autorizados y lanzar un error CORS", async () => {
    const response = await request(app)
      .get("/api/tractors")
      .set("Origin", "https://sitio-malicioso.com");

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/CORS/i);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  test("debería incluir los métodos permitidos en el preflight", async () => {
    const response = await request(app)
      .options("/api/tractors")
      .set("Origin", "http://localhost:3000")
      .set("Access-Control-Request-Method", "PUT");

    const allowedMethods = response.headers["access-control-allow-methods"];
    expect(allowedMethods).toMatch(/GET/);
    expect(allowedMethods).toMatch(/POST/);
    expect(allowedMethods).toMatch(/PUT/);
    expect(allowedMethods).toMatch(/DELETE/);
  });

  test("debería incluir los headers permitidos en el preflight", async () => {
    const response = await request(app)
      .options("/api/tractors")
      .set("Origin", "http://localhost:3000")
      .set("Access-Control-Request-Method", "GET")
      .set("Access-Control-Request-Headers", "Authorization, Content-Type");

    const allowedHeaders = response.headers["access-control-allow-headers"];
    expect(allowedHeaders).toMatch(/Content-Type/i);
    expect(allowedHeaders).toMatch(/Authorization/i);
  });

  test("debería incluir Access-Control-Allow-Credentials: true", async () => {
    const response = await request(app)
      .options("/api/tractors")
      .set("Origin", "http://localhost:3000")
      .set("Access-Control-Request-Method", "GET");

    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });

  test("debería permitir peticiones sin Origin (ej. Postman, curl)", async () => {
    const response = await request(app).get("/");
    // Sin header Origin, no hay error CORS
    expect(response.status).toBe(200);
  });
});
