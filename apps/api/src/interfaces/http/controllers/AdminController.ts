import type { Request, Response } from 'express';
import { z } from 'zod';
import { container } from 'tsyringe';
import {
  AuditLogQueryRequestSchema,
  CreateProctorRequestSchema,
  UpdateProctorRequestSchema,
  CreateExamPeriodRequestSchema,
  CreateExamRequestSchema,
  type AuditLogEntryDto,
  type AuditLogPageResponse,
  type ProctorListItem,
  type ProctorListResponse,
  type ExamPeriodDto,
  type ExamPeriodListResponse,
  type ExamDto,
  type ExamListResponse,
  type ResetPasswordResponse,
  type StaffUserDto,
  type StaffUserListResponse,
} from '@app/shared';
import { CreateProctorUseCase } from '../../../application/use-cases/admin/proctor/CreateProctorUseCase.js';
import { UpdateProctorUseCase } from '../../../application/use-cases/admin/proctor/UpdateProctorUseCase.js';
import { DeactivateProctorUseCase } from '../../../application/use-cases/admin/proctor/DeactivateProctorUseCase.js';
import { ListProctorsUseCase } from '../../../application/use-cases/admin/proctor/ListProctorsUseCase.js';
import { ResetProctorPasswordUseCase } from '../../../application/use-cases/admin/proctor/ResetProctorPasswordUseCase.js';
import { CreateExamPeriodUseCase } from '../../../application/use-cases/admin/exam-period/CreateExamPeriodUseCase.js';
import { CloseExamPeriodUseCase } from '../../../application/use-cases/admin/exam-period/CloseExamPeriodUseCase.js';
import { ListExamPeriodsUseCase } from '../../../application/use-cases/admin/exam-period/ListExamPeriodsUseCase.js';
import { CreateExamUseCase } from '../../../application/use-cases/admin/exam-period/CreateExamUseCase.js';
import { DeleteExamUseCase } from '../../../application/use-cases/admin/exam-period/DeleteExamUseCase.js';
import { ListExamsForPeriodUseCase } from '../../../application/use-cases/admin/exam-period/ListExamsForPeriodUseCase.js';
import { ImportProctorsUseCase } from '../../../application/use-cases/admin/proctor/ImportProctorsUseCase.js';
import { ListStaffUsersUseCase } from '../../../application/use-cases/admin/staff/ListStaffUsersUseCase.js';
import { ResetStaffPasswordUseCase } from '../../../application/use-cases/admin/staff/ResetStaffPasswordUseCase.js';
import { ListAuditLogUseCase } from '../../../application/use-cases/admin/audit/ListAuditLogUseCase.js';
import { DomainError } from '../../../domain/errors/DomainError.js';
import type { ImportProctorsResult } from '@app/shared';
import type { User } from '../../../domain/entities/User.js';
import type { ExamPeriod } from '../../../domain/entities/ExamPeriod.js';
import type { Exam } from '../../../domain/entities/Exam.js';

const IdParamSchema = z.object({ id: z.string().uuid() });
const PeriodIdParamSchema = z.object({ periodId: z.string().uuid() });
const PeriodAndIdParamSchema = z.object({
  periodId: z.string().uuid(),
  id: z.string().uuid(),
});

function toProctorListItem(u: User): ProctorListItem {
  if (!u.isProctor() || u.proctorType === null) {
    throw new Error('Non-proctor user leaked into proctor list');
  }
  return {
    id: u.id,
    nationalId: u.nationalId.toString(),
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    email: u.email,
    proctorType: u.proctorType,
    active: u.active,
  };
}

function toExamPeriodDto(p: ExamPeriod): ExamPeriodDto {
  return {
    id: p.id,
    name: p.name,
    deadline: p.deadline.toISOString(),
    status: p.status,
    createdAt: p.createdAt.toISOString(),
  };
}

function toExamDto(e: Exam): ExamDto {
  return {
    id: e.id,
    periodId: e.periodId,
    examDate: e.examDate,
    // Wire format is HH:MM (no seconds); the DB stores HH:MM:SS.
    startTime: e.startTime.slice(0, 5),
    endTime: e.endTime.slice(0, 5),
    classroomCount: e.classroomCount,
  };
}

export class AdminController {
  // ── Proctors ────────────────────────────────────────────────────────────

  public static async createProctor(req: Request, res: Response): Promise<void> {
    const input = CreateProctorRequestSchema.parse(req.body);
    const useCase = container.resolve(CreateProctorUseCase);
    const user = await useCase.execute({ ...input, actorId: req.auth!.sub });
    res.status(201).json(toProctorListItem(user));
  }

  public static async listProctors(_req: Request, res: Response): Promise<void> {
    const useCase = container.resolve(ListProctorsUseCase);
    const users = await useCase.execute({ includeInactive: true });
    const body: ProctorListResponse = { proctors: users.map(toProctorListItem) };
    res.json(body);
  }

  public static async updateProctor(req: Request, res: Response): Promise<void> {
    const { id } = IdParamSchema.parse(req.params);
    const patch = UpdateProctorRequestSchema.parse(req.body);
    const useCase = container.resolve(UpdateProctorUseCase);
    await useCase.execute({ userId: id, patch });
    res.status(204).end();
  }

  public static async deactivateProctor(req: Request, res: Response): Promise<void> {
    const { id } = IdParamSchema.parse(req.params);
    const useCase = container.resolve(DeactivateProctorUseCase);
    await useCase.execute({ actorId: req.auth!.sub, userId: id });
    res.status(204).end();
  }

  public static async importProctors(req: Request, res: Response): Promise<void> {
    const file = (req as Request & { file?: { buffer: Buffer; mimetype: string } }).file;
    if (!file) {
      throw new DomainError('INVARIANT_VIOLATED', 'Missing uploaded file', 400);
    }
    const useCase = container.resolve(ImportProctorsUseCase);
    const result = await useCase.execute({
      actorId: req.auth!.sub,
      buffer: file.buffer,
      mimeType: file.mimetype,
    });
    const body: ImportProctorsResult = result;
    res.status(200).json(body);
  }

  public static async resetProctorPassword(req: Request, res: Response): Promise<void> {
    const { id } = IdParamSchema.parse(req.params);
    const useCase = container.resolve(ResetProctorPasswordUseCase);
    const { temporaryPassword } = await useCase.execute({
      actorId: req.auth!.sub,
      userId: id,
    });
    const body: ResetPasswordResponse = { temporaryPassword };
    res.json(body);
  }

  // ── Exam periods ────────────────────────────────────────────────────────

  public static async createPeriod(req: Request, res: Response): Promise<void> {
    const input = CreateExamPeriodRequestSchema.parse(req.body);
    const actorId = req.auth!.sub;
    const useCase = container.resolve(CreateExamPeriodUseCase);
    const period = await useCase.execute({
      name: input.name,
      deadline: new Date(input.deadline),
      actorId,
    });
    res.status(201).json(toExamPeriodDto(period));
  }

  public static async listPeriods(_req: Request, res: Response): Promise<void> {
    const useCase = container.resolve(ListExamPeriodsUseCase);
    const periods = await useCase.execute();
    const body: ExamPeriodListResponse = { periods: periods.map(toExamPeriodDto) };
    res.json(body);
  }

  public static async closePeriod(req: Request, res: Response): Promise<void> {
    const { id } = IdParamSchema.parse(req.params);
    const useCase = container.resolve(CloseExamPeriodUseCase);
    await useCase.execute({ periodId: id });
    res.status(204).end();
  }

  // ── Exams ───────────────────────────────────────────────────────────────

  public static async createExam(req: Request, res: Response): Promise<void> {
    const { periodId } = PeriodIdParamSchema.parse(req.params);
    const input = CreateExamRequestSchema.parse(req.body);
    const useCase = container.resolve(CreateExamUseCase);
    const exam = await useCase.execute({ periodId, ...input });
    res.status(201).json(toExamDto(exam));
  }

  public static async listExams(req: Request, res: Response): Promise<void> {
    const { periodId } = PeriodIdParamSchema.parse(req.params);
    const useCase = container.resolve(ListExamsForPeriodUseCase);
    const exams = await useCase.execute({ periodId });
    const body: ExamListResponse = { exams: exams.map(toExamDto) };
    res.json(body);
  }

  public static async deleteExam(req: Request, res: Response): Promise<void> {
    const { id } = PeriodAndIdParamSchema.parse(req.params);
    const useCase = container.resolve(DeleteExamUseCase);
    await useCase.execute({ examId: id });
    res.status(204).end();
  }

  // ── Staff users (exam_staff role) ──────────────────────────────────────

  public static async listStaffUsers(_req: Request, res: Response): Promise<void> {
    const useCase = container.resolve(ListStaffUsersUseCase);
    const users = await useCase.execute({ includeInactive: true });
    const body: StaffUserListResponse = {
      users: users.map<StaffUserDto>((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        active: u.active,
      })),
    };
    res.json(body);
  }

  public static async resetStaffPassword(req: Request, res: Response): Promise<void> {
    const { id } = IdParamSchema.parse(req.params);
    const useCase = container.resolve(ResetStaffPasswordUseCase);
    const { temporaryPassword } = await useCase.execute({
      actorId: req.auth!.sub,
      userId: id,
    });
    const body: ResetPasswordResponse = { temporaryPassword };
    res.json(body);
  }

  // ── Audit log ──────────────────────────────────────────────────────────

  public static async listAuditLog(req: Request, res: Response): Promise<void> {
    const q = AuditLogQueryRequestSchema.parse(req.query);
    const useCase = container.resolve(ListAuditLogUseCase);
    const page = await useCase.execute({
      page: q.page,
      limit: q.limit,
      from: q.from === undefined ? undefined : new Date(q.from),
      to: q.to === undefined ? undefined : new Date(q.to),
    });
    const body: AuditLogPageResponse = {
      page: page.page,
      limit: page.limit,
      total: page.total,
      items: page.items.map<AuditLogEntryDto>((it) => ({
        id: it.id,
        actorId: it.actorId,
        actorName: it.actorName,
        action: it.action,
        targetType: it.targetType,
        targetId: it.targetId,
        payload: it.payload,
        createdAt: it.createdAt.toISOString(),
      })),
    };
    res.json(body);
  }
}
