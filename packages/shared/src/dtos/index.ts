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

export type {
  CreateProctorRequest,
  UpdateProctorRequest,
  ProctorListItem,
  ProctorListResponse,
  CreateExamPeriodRequest,
  ExamPeriodDto,
  ExamPeriodListResponse,
  CreateExamRequest,
  ExamDto,
  ExamListResponse,
  ResetPasswordResponse,
  ImportProctorsResult,
} from '../schemas/admin.js';
