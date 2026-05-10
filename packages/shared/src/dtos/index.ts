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
  StaffUserDto,
  StaffUserListResponse,
} from '../schemas/admin.js';

export type {
  RunSchedulerRequest,
  ProctorRef,
  AssignmentDto,
  UnfilledClassroom,
  ScheduleResultDto,
  ManualOverrideRequest,
  ScheduleViewExamDto,
  ScheduleViewResponse,
} from '../schemas/scheduling.js';

export type {
  SendSchedulesRequest,
  SendSchedulesResponse,
} from '../schemas/notifications.js';

export type {
  MyPeriodDto,
  MyPeriodsResponse,
  MyAssignmentDto,
  MyScheduleResponse,
  FinalizeAvailabilityResponse,
} from '../schemas/proctor.js';

export type {
  AuditLogQueryRequest,
  AuditLogEntryDto,
  AuditLogPageResponse,
} from '../schemas/audit.js';
