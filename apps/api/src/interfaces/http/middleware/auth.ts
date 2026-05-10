import type { NextFunction, Request, Response } from 'express';
import { container } from 'tsyringe';
import {
  ITokenServiceToken,
  type AccessTokenClaims,
  type ITokenService,
} from '../../../application/ports/services/ITokenService.js';
import type { UserRole } from '@app/shared';

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AccessTokenClaims;
  }
}

export function authenticate() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.header('authorization') ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Missing token' } });
      return;
    }
    try {
      const tokens = container.resolve<ITokenService>(ITokenServiceToken);
      const claims = tokens.verify(token);
      req.auth = claims;
      next();
    } catch {
      res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Invalid token' } });
    }
  };
}

export function requireRole(...allowed: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } });
      return;
    }
    if (!allowed.includes(req.auth.role)) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient role' } });
      return;
    }
    next();
  };
}
