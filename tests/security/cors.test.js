import { describe, test, expect } from "@jest/globals";
import request from "supertest";
import app from "../../src/app.js";

describe("CORS Middleware", () => {
  test("debería permitir orígenes autorizados (ej. un preflight desde localhost:3000)", async () => {
    // Simulamos un request de preflight OPTIONS desde un origen permitido
    const response = await request(app)
      .options("/api/tractors")
      .set("Origin", "http://localhost:3000")
      .set("Access-Control-Request-Method", "GET");

    // En Express (cors middleware default), un preflight correcto devuelve 204 No Content
    expect(response.status).toBe(204);
    // El header Access-Control-Allow-Origin debe reflejar el Origen permitido
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000",
    );
    expect(response.headers["access-control-allow-methods"]).toMatch(/GET/);
  });

  test("debería bloquear orígenes NO autorizados y lanzar un error CORS", async () => {
    const response = await request(app)
      .get("/api/tractors")
      .set("Origin", "https://sitio-malicioso.com");

    expect(response.status).toBe(500); // cors middleware lanza un error general
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/CORS/i);
    // Verificar expresamente que la respuesta no expone data ni permite el origin
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
