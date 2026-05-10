import type { Request, Response } from 'express';
import { z } from 'zod';
import { container } from 'tsyringe';
import type {
  FinalizeAvailabilityResponse,
  MyAssignmentDto,
  MyPeriodDto,
  MyPeriodsResponse,
  MyScheduleResponse,
} from '@app/shared';
import { FinalizeAvailabilityUseCase } from '../../../application/use-cases/availability/FinalizeAvailabilityUseCase.js';
import { ListMyPeriodsUseCase } from '../../../application/use-cases/proctor/ListMyPeriodsUseCase.js';
import { ListMyAssignmentsUseCase } from '../../../application/use-cases/proctor/ListMyAssignmentsUseCase.js';

const PeriodIdParamSchema = z.object({ periodId: z.string().uuid() });

export class ProctorController {
  public static async myPeriods(req: Request, res: Response): Promise<void> {
    const userId = req.auth!.sub;
    const useCase = container.resolve(ListMyPeriodsUseCase);
    const items = await useCase.execute({ userId });
    const body: MyPeriodsResponse = {
      periods: items.map(({ period, exams, availability, submitted }) => {
        const dto: MyPeriodDto = {
          id: period.id,
          name: period.name,
          status: period.status,
          deadline: period.deadline.toISOString(),
          submitted,
          exams: exams.map((exam) => ({
            id: exam.id,
            periodId: exam.periodId,
            examDate: exam.examDate,
            startTime: exam.startTime.slice(0, 5),
            endTime: exam.endTime.slice(0, 5),
            classroomCount: exam.classroomCount,
            myAvailability: availability.has(exam.id) ? availability.get(exam.id)! : null,
          })),
        };
        return dto;
      }),
    };
    res.json(body);
  }

  public static async mySchedule(req: Request, res: Response): Promise<void> {
    const userId = req.auth!.sub;
    const useCase = container.resolve(ListMyAssignmentsUseCase);
    const items = await useCase.execute({ userId });
    const body: MyScheduleResponse = {
      assignments: items.map(
        (item): MyAssignmentDto => ({
          examId: item.examId,
          examDate: item.exam.examDate,
          startTime: item.exam.startTime.slice(0, 5),
          endTime: item.exam.endTime.slice(0, 5),
          classroomIndex: item.classroomIndex,
          role: item.role,
          partner:
            item.partner === null
              ? null
              : {
                  id: item.partner.id,
                  firstName: item.partner.firstName,
                  lastName: item.partner.lastName,
                },
          notes: item.notes,
          period: { id: item.period.id, name: item.period.name },
        }),
      ),
    };
    res.json(body);
  }

  public static async finalize(req: Request, res: Response): Promise<void> {
    const { periodId } = PeriodIdParamSchema.parse(req.params);
    const userId = req.auth!.sub;
    const useCase = container.resolve(FinalizeAvailabilityUseCase);
    const result = await useCase.execute({ userId, periodId });
    const body: FinalizeAvailabilityResponse = {
      periodId: result.periodId,
      submittedAt: result.submittedAt.toISOString(),
    };
    res.status(200).json(body);
  }
}
