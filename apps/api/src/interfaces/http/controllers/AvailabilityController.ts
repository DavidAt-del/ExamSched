import type { Request, Response } from 'express';
import { container } from 'tsyringe';
import {
  SubmitAvailabilityRequestSchema,
  type AvailabilityDto,
  type ListExamsResponse,
} from '@app/shared';
import { SubmitAvailabilityUseCase } from '../../../application/use-cases/availability/SubmitAvailabilityUseCase.js';
import { ListExamsForProctorUseCase } from '../../../application/use-cases/availability/ListExamsForProctorUseCase.js';

export class AvailabilityController {
  public static async submit(req: Request, res: Response): Promise<void> {
    const input = SubmitAvailabilityRequestSchema.parse(req.body);
    const userId = req.auth!.sub;
    const useCase = container.resolve(SubmitAvailabilityUseCase);
    const a = await useCase.execute({ userId, ...input });
    const body: AvailabilityDto = {
      id: a.id,
      examId: a.examId,
      userId: a.userId,
      available: a.available,
      submittedAt: a.submittedAt.toISOString(),
    };
    res.status(200).json(body);
  }

  public static async listExams(req: Request, res: Response): Promise<void> {
    const userId = req.auth!.sub;
    const useCase = container.resolve(ListExamsForProctorUseCase);
    const items = await useCase.execute({ userId });
    const body: ListExamsResponse = {
      exams: items.map(({ exam, myAvailability }) => ({
        id: exam.id,
        periodId: exam.periodId,
        examDate: exam.examDate,
        startTime: exam.startTime,
        endTime: exam.endTime,
        classroomCount: exam.classroomCount,
        myAvailability,
      })),
    };
    res.status(200).json(body);
  }
}
