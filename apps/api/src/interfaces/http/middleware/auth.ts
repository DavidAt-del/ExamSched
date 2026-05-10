import type { NextFunction, Request, Response } from 'express';
import { container } from 'tsyringe';
import {
  ITokenServiceToken,
  type AccessTokenClaims,
  type ITokenService,
} from '../../../application/ports/services/ITokenService.js';
import type { UserRole } from '@app/shared';
import {
  ForbiddenError,
  UnauthenticatedError,
} from '../../../domain/errors/DomainError.js';

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AccessTokenClaims;
  }
}

export function authenticate() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.header('authorization') ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      next(new UnauthenticatedError('Missing bearer token'));
      return;
    }
    try {
      const tokens = container.resolve<ITokenService>(ITokenServiceToken);
      req.auth = tokens.verify(token);
      next();
    } catch {
      next(new UnauthenticatedError('Invalid or expired token'));
    }
  };
}

export function requireRole(...allowed: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new UnauthenticatedError());
      return;
    }
    if (!allowed.includes(req.auth.role)) {
      next(new ForbiddenError('Insufficient role'));
      return;
    }
    next();
  };
}
