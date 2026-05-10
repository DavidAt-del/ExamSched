import type { Request, Response } from 'express';
import { container } from 'tsyringe';
import { LoginRequestSchema, ChangePasswordRequestSchema, type LoginResponse } from '@app/shared';
import { LoginUseCase } from '../../../application/use-cases/auth/LoginUseCase.js';
import { ChangePasswordUseCase } from '../../../application/use-cases/auth/ChangePasswordUseCase.js';

export class AuthController {
  public static async login(req: Request, res: Response): Promise<void> {
    const input = LoginRequestSchema.parse(req.body);
    const useCase = container.resolve(LoginUseCase);
    const result = await useCase.execute(input);
    const body: LoginResponse = {
      token: result.token,
      user: {
        id: result.user.id,
        nationalId: result.user.nationalId.toString(),
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
        role: result.user.role,
        proctorType: result.user.proctorType,
        mustChangePassword: result.user.mustChangePassword,
      },
    };
    res.status(200).json(body);
  }

  public static async changePassword(req: Request, res: Response): Promise<void> {
    const input = ChangePasswordRequestSchema.parse(req.body);
    const userId = req.auth!.sub;
    const useCase = container.resolve(ChangePasswordUseCase);
    await useCase.execute({ userId, ...input });
    res.status(204).end();
  }
}
