import type { Request, Response } from 'express';
import { z } from 'zod';
import { container } from 'tsyringe';
import {
  ManualOverrideRequestSchema,
  SendSchedulesRequestSchema,
  type AssignmentDto,
  type ScheduleResultDto,
  type ScheduleViewResponse,
  type SendSchedulesResponse,
} from '@app/shared';
import { RunSchedulerUseCase } from '../../../application/use-cases/scheduling/RunSchedulerUseCase.js';
import { ManualOverrideAssignmentUseCase } from '../../../application/use-cases/scheduling/ManualOverrideAssignmentUseCase.js';
import { ScheduleViewUseCase } from '../../../application/use-cases/scheduling/ScheduleViewUseCase.js';
import { ExportScheduleUseCase } from '../../../application/use-cases/scheduling/ExportScheduleUseCase.js';
import { SendSchedulesUseCase } from '../../../application/use-cases/notifications/SendSchedulesUseCase.js';
import type { Assignment } from '../../../domain/entities/Assignment.js';
import type { User } from '../../../domain/entities/User.js';

const PeriodIdParamSchema = z.object({ periodId: z.string().uuid() });
const ExamClassroomParamSchema = z.object({
  examId: z.string().uuid(),
  idx: z.coerce.number().int().nonnegative(),
});

function placeholderRef(userId: string): { id: string; firstName: string; lastName: string } {
  // Used only when an assignment references a user who's been deleted between
  // scheduling and rendering — extremely rare; surface as "?" rather than 500.
  return { id: userId, firstName: '?', lastName: '?' };
}

function toAssignmentDto(a: Assignment, users: Map<string, User>): AssignmentDto {
  const opener = users.get(a.openerUserId);
  const regular = a.regularUserId === null ? null : users.get(a.regularUserId) ?? null;
  return {
    id: a.id,
    examId: a.examId,
    classroomIndex: a.classroomIndex,
    opener: opener
      ? { id: opener.id, firstName: opener.firstName, lastName: opener.lastName }
      : placeholderRef(a.openerUserId),
    regular:
      a.regularUserId === null
        ? null
        : regular
          ? {
              id: regular.id,
              firstName: regular.firstName,
              lastName: regular.lastName,
            }
          : placeholderRef(a.regularUserId),
    manualOverride: a.manualOverride,
    notes: a.notes,
  };
}

export class SchedulingController {
  public static async run(req: Request, res: Response): Promise<void> {
    const { periodId } = PeriodIdParamSchema.parse(req.params);
    const actorId = req.auth!.sub;
    const useCase = container.resolve(RunSchedulerUseCase);
    const result = await useCase.execute({ periodId, actorId });

    // Hydrate user names via the same path used by GET; keeps the response
    // self-contained so the client doesn't need a follow-up call.
    const view = await container.resolve(ScheduleViewUseCase).execute({ periodId });
    const body: ScheduleResultDto = {
      assignments: result.assignments.map((a) => toAssignmentDto(a, view.users)),
      unfilledClassrooms: result.unfilledClassrooms.map((u) => ({
        examId: u.examId,
        index: u.index,
      })),
    };
    res.status(200).json(body);
  }

  public static async view(req: Request, res: Response): Promise<void> {
    const { periodId } = PeriodIdParamSchema.parse(req.params);
    const useCase = container.resolve(ScheduleViewUseCase);
    const out = await useCase.execute({ periodId });
    const body: ScheduleViewResponse = {
      period: {
        id: out.period.id,
        name: out.period.name,
        deadline: out.period.deadline.toISOString(),
        status: out.period.status,
        createdAt: out.period.createdAt.toISOString(),
      },
      exams: out.exams.map(({ exam, assignments }) => ({
        id: exam.id,
        periodId: exam.periodId,
        examDate: exam.examDate,
        startTime: exam.startTime.slice(0, 5),
        endTime: exam.endTime.slice(0, 5),
        classroomCount: exam.classroomCount,
        assignments: assignments.map((a) => toAssignmentDto(a, out.users)),
      })),
    };
    res.json(body);
  }

  public static async manualOverride(req: Request, res: Response): Promise<void> {
    const { examId, idx } = ExamClassroomParamSchema.parse(req.params);
    const body = ManualOverrideRequestSchema.parse(req.body);
    const actorId = req.auth!.sub;
    const useCase = container.resolve(ManualOverrideAssignmentUseCase);
    await useCase.execute({
      actorId,
      examId,
      classroomIndex: idx,
      openerUserId: body.openerUserId,
      regularUserId: body.regularUserId,
      notes: body.notes,
    });
    res.status(204).end();
  }

  public static async exportSchedule(req: Request, res: Response): Promise<void> {
    const { periodId } = PeriodIdParamSchema.parse(req.params);
    const useCase = container.resolve(ExportScheduleUseCase);
    const { buffer, filename } = await useCase.execute({ periodId });
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(buffer);
  }

  public static async sendSchedule(req: Request, res: Response): Promise<void> {
    const { periodId } = PeriodIdParamSchema.parse(req.params);
    const body = SendSchedulesRequestSchema.parse(req.body ?? {});
    const actorId = req.auth!.sub;
    const useCase = container.resolve(SendSchedulesUseCase);
    const result = await useCase.execute({
      actorId,
      periodId,
      userIds: body.userIds,
    });
    const out: SendSchedulesResponse = result;
    res.status(200).json(out);
  }
}

