import type { UserRole } from '@app/shared';

export interface AccessTokenClaims {
  sub: string; // user id
  role: UserRole;
  mustChangePassword: boolean;
}

export interface ITokenService {
  issue(claims: AccessTokenClaims): string;
  verify(token: string): AccessTokenClaims;
}

export const ITokenServiceToken = Symbol.for('ITokenService');
