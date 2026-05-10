// DTOs are inferred from the Zod schemas to keep a single source of truth.
export type {
  LoginRequest,
  LoginResponse,
  AuthenticatedUser,
  ChangePasswordRequest,
} from '../schemas/auth.js';

export type {
  SubmitAvailabilityRequest,
  AvailabilityDto,
  ExamSummaryDto,
  ListExamsResponse,
} from '../schemas/availability.js';

export type { ErrorResponse } from '../schemas/errors.js';
