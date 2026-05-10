import type { ErrorRequestHandler, Request, Response } from 'express';
import { ZodError } from 'zod';
import { DomainError } from '../../../domain/errors/DomainError.js';

interface ApiError {
  status: number;
  body: {
    error: { code: string; message: string; details?: unknown };
    requestId?: string;
  };
}

function classify(err: unknown, req: Request, res: Response): ApiError {
  const requestId = (res.locals.requestId as string | undefined) ?? undefined;

  if (err instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Request validation failed',
          details: err.flatten(),
        },
        ...(requestId !== undefined ? { requestId } : {}),
      },
    };
  }
  if (err instanceof DomainError) {
    return {
      status: err.status,
      body: {
        error: { code: err.code, message: err.message },
        ...(requestId !== undefined ? { requestId } : {}),
      },
    };
  }
  // Token errors / unknown

  console.error('Unhandled error', { err, path: req.path });
  return {
    status: 500,
    body: {
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      ...(requestId !== undefined ? { requestId } : {}),
    },
  };
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next): void => {
  const { status, body } = classify(err, req, res);
  res.status(status).json(body);
};
