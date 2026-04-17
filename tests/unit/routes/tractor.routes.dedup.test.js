import { describe, test, expect, jest, beforeEach } from "@jest/globals";

const getAllTractors = jest.fn();
const getAvailableTractors = jest.fn();
const searchTractors = jest.fn();
const getTractorById = jest.fn();
const createTractor = jest.fn();
const updateTractor = jest.fn();
const deleteTractor = jest.fn();

const verifyTokenMiddleware = jest.fn((req, _res, next) => next?.());
const isAdmin = jest.fn((req, _res, next) => next?.());
const validateTractor = jest.fn((req, _res, next) => next?.());
const paginationMiddleware = jest.fn(() => (req, _res, next) => next?.());
const cacheMiddleware = jest.fn(() => (req, _res, next) => next?.());
const invalidateCacheMiddleware = jest.fn(() => (req, _res, next) => next?.());

const loadRouter = async () => {
  jest.resetModules();

  jest.unstable_mockModule("../../../src/controllers/tractorController.js", () => ({
    getAllTractors,
    getAvailableTractors,
    searchTractors,
    getTractorById,
    createTractor,
    updateTractor,
    deleteTractor,
  }));

  jest.unstable_mockModule("../../../src/middleware/auth.middleware.js", () => ({
    verifyTokenMiddleware,
    isAdmin,
  }));

  jest.unstable_mockModule("../../../src/middleware/validation.middleware.js", () => ({
    validateTractor,
  }));

  jest.unstable_mockModule("../../../src/middleware/pagination.middleware.js", () => ({
    paginationMiddleware,
  }));

  jest.unstable_mockModule("../../../src/middleware/cache.middleware.js", () => ({
    cacheMiddleware,
    invalidateCacheMiddleware,
  }));

  const module = await import("../../../src/routes/tractor.routes.js");
  return module.default;
};

const getRouteSignatures = (router) => {
  const signatures = [];

  router.stack
    .filter((layer) => layer.route)
    .forEach((layer) => {
      const methods = Object.keys(layer.route.methods);
      methods.forEach((method) => signatures.push(`${method.toUpperCase()} ${layer.route.path}`));
    });

  return signatures;
};

describe("tractor.routes duplicate cleanup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("each HTTP method + path combination appears exactly once", async () => {
    const router = await loadRouter();
    const signatures = getRouteSignatures(router);
    const uniqueSignatures = new Set(signatures);

    expect(signatures.length).toBe(uniqueSignatures.size);
    expect(signatures.filter((signature) => signature === "GET /")).toHaveLength(1);
    expect(signatures.filter((signature) => signature === "POST /")).toHaveLength(1);
    expect(signatures.filter((signature) => signature === "PUT /:id")).toHaveLength(1);
    expect(signatures.filter((signature) => signature === "DELETE /:id")).toHaveLength(1);
  });

  test("mutation routes are admin-protected and keep cache invalidation", async () => {
    const router = await loadRouter();
    const routeLayers = router.stack.filter((layer) => layer.route);

    const postRoute = routeLayers.find(
      (layer) => layer.route.path === "/" && layer.route.methods.post,
    );
    const putRoute = routeLayers.find(
      (layer) => layer.route.path === "/:id" && layer.route.methods.put,
    );
    const deleteRoute = routeLayers.find(
      (layer) => layer.route.path === "/:id" && layer.route.methods.delete,
    );

    expect(postRoute.route.stack[0].handle).toBe(verifyTokenMiddleware);
    expect(postRoute.route.stack[1].handle).toBe(isAdmin);
    expect(postRoute.route.stack[2].handle).toBe(validateTractor);
    expect(postRoute.route.stack.at(-1).handle).toBe(createTractor);

    expect(putRoute.route.stack[0].handle).toBe(verifyTokenMiddleware);
    expect(putRoute.route.stack[1].handle).toBe(isAdmin);
    expect(putRoute.route.stack[2].handle).toBe(validateTractor);
    expect(putRoute.route.stack.at(-1).handle).toBe(updateTractor);

    expect(deleteRoute.route.stack[0].handle).toBe(verifyTokenMiddleware);
    expect(deleteRoute.route.stack[1].handle).toBe(isAdmin);
    expect(deleteRoute.route.stack.at(-1).handle).toBe(deleteTractor);

    expect(invalidateCacheMiddleware).toHaveBeenCalledWith("*tractors*");
    expect(invalidateCacheMiddleware).toHaveBeenCalledWith([
      "*tractors*",
      "*recommendations*",
    ]);
  });
});
