import jwt from 'jsonwebtoken';
import { injectable } from 'tsyringe';
import { UserRole } from '@app/shared';
import type {
  AccessTokenClaims,
  ITokenService,
} from '../../application/ports/services/ITokenService.js';

@injectable()
export class JwtTokenService implements ITokenService {
  constructor(
    private readonly secret: string,
    private readonly ttlSeconds: number,
  ) {}

  public issue(claims: AccessTokenClaims): string {
    return jwt.sign(claims, this.secret, {
      algorithm: 'HS256',
      expiresIn: this.ttlSeconds,
    });
  }

  public verify(token: string): AccessTokenClaims {
    const decoded = jwt.verify(token, this.secret, { algorithms: ['HS256'] });
    if (typeof decoded === 'string' || decoded === null) {
      throw new Error('Invalid token payload');
    }
    const role = decoded.role;
    if (role !== UserRole.Admin && role !== UserRole.ExamStaff && role !== UserRole.Proctor) {
      throw new Error('Invalid role claim');
    }
    return {
      sub: String(decoded.sub),
      role,
      mustChangePassword: Boolean(decoded.mustChangePassword),
    };
  }
}
