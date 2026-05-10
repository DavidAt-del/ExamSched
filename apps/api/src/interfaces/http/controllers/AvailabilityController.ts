import type { Request, Response } from 'express';
import { container } from 'tsyringe';
import {
  SubmitAvailabilityRequestSchema,
  type AvailabilityDto,
} from '@app/shared';
import { SubmitAvailabilityUseCase } from '../../../application/use-cases/availability/SubmitAvailabilityUseCase.js';

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
}
