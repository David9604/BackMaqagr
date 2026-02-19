/**
 * Tests unitarios para errors.util.js (DDAAM-111)
 */

import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
} from '../../../src/utils/errors.util.js';

describe('AppError (base)', () => {
  it('stores message, statusCode and isOperational', () => {
    const err = new AppError('Something went wrong', 500);
    expect(err.message).toBe('Something went wrong');
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(true);
    expect(err instanceof Error).toBe(true);
  });

  it('defaults to statusCode 500', () => {
    const err = new AppError('oops');
    expect(err.statusCode).toBe(500);
  });

  it('has a stack trace', () => {
    const err = new AppError('trace test');
    expect(err.stack).toBeDefined();
  });
});

describe('ValidationError', () => {
  it('has statusCode 400', () => {
    const err = new ValidationError();
    expect(err.statusCode).toBe(400);
  });

  it('stores errors array', () => {
    const err = new ValidationError('Bad input', ['field required', 'email invalid']);
    expect(err.errors).toEqual(['field required', 'email invalid']);
  });
});

describe('AuthenticationError', () => {
  it('has statusCode 401', () => {
    expect(new AuthenticationError().statusCode).toBe(401);
  });
});

describe('AuthorizationError', () => {
  it('has statusCode 403', () => {
    expect(new AuthorizationError().statusCode).toBe(403);
  });
});

describe('NotFoundError', () => {
  it('has statusCode 404', () => {
    expect(new NotFoundError().statusCode).toBe(404);
  });
});

describe('ConflictError', () => {
  it('has statusCode 409', () => {
    expect(new ConflictError().statusCode).toBe(409);
  });
});
