import { describe, expect, it } from 'vitest';
import { AppError } from './errors';

describe('AppError', () => {
  it('maps each code to the expected HTTP status', () => {
    expect(new AppError('VALIDATION_ERROR', 'bad').status).toBe(400);
    expect(new AppError('UNAUTHORIZED', 'no').status).toBe(401);
    expect(new AppError('FORBIDDEN', 'no').status).toBe(403);
    expect(new AppError('NOT_FOUND', 'no').status).toBe(404);
    expect(new AppError('CONFLICT', 'no').status).toBe(409);
    expect(new AppError('RATE_LIMITED', 'slow').status).toBe(429);
    expect(new AppError('INTERNAL_ERROR', 'boom').status).toBe(500);
    expect(new AppError('UPSTREAM_ERROR', 'bad gateway').status).toBe(502);
    expect(new AppError('SERVICE_UNAVAILABLE', 'off').status).toBe(503);
    expect(new AppError('UPSTREAM_TIMEOUT', 'slow').status).toBe(504);
  });

  it('preserves the original cause for internal diagnostics', () => {
    const cause = new Error('db down');
    const error = new AppError('INTERNAL_ERROR', 'boom', { cause });
    expect(error.cause).toBe(cause);
  });

  it('is an instance of Error', () => {
    const error = new AppError('NOT_FOUND', 'missing');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('AppError');
  });
});
