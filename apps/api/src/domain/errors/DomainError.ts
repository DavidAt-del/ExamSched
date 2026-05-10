export type DomainErrorCode =
  | 'INVALID_NATIONAL_ID'
  | 'INVALID_EMAIL'
  | 'INVALID_PHONE'
  | 'INVALID_DATE_RANGE'
  | 'INVALID_CREDENTIALS'
  | 'PASSWORD_CHANGE_REQUIRED'
  | 'USER_INACTIVE'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'INVARIANT_VIOLATED'
  | 'PERIOD_LOCKED';

export class DomainError extends Error {
  public readonly code: DomainErrorCode;
  public readonly status: number;

  constructor(code: DomainErrorCode, message: string, status = 400) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.status = status;
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('INVALID_CREDENTIALS', 'Invalid national id or password', 401);
    this.name = 'InvalidCredentialsError';
  }
}

export class UserInactiveError extends DomainError {
  constructor() {
    super('USER_INACTIVE', 'User account is inactive', 403);
    this.name = 'UserInactiveError';
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthenticatedError extends DomainError {
  constructor(message = 'Not authenticated') {
    super('UNAUTHENTICATED', message, 401);
    this.name = 'UnauthenticatedError';
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'Forbidden') {
    super('FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
  }
}

export class InvariantViolationError extends DomainError {
  constructor(message: string) {
    super('INVARIANT_VIOLATED', message, 422);
    this.name = 'InvariantViolationError';
  }
}

export class PeriodLockedError extends DomainError {
  constructor(message = 'The exam period is no longer accepting changes') {
    super('PERIOD_LOCKED', message, 423);
    this.name = 'PeriodLockedError';
  }
}
