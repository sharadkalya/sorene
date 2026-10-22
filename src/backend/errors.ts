/**
 * Typed application errors. Route handlers map these to consistent HTTP
 * responses via `jsonError` in `backend/http.ts`. Services throw these instead
 * of returning ad-hoc result objects, and never expose raw infrastructure
 * errors to clients.
 */

export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'UPSTREAM_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'UPSTREAM_TIMEOUT';

const STATUS_BY_CODE: Record<AppErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  UPSTREAM_ERROR: 502,
  SERVICE_UNAVAILABLE: 503,
  UPSTREAM_TIMEOUT: 504,
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly cause?: unknown;

  constructor(code: AppErrorCode, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.cause = options?.cause;
  }
}
