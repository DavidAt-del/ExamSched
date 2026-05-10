import { Router } from 'express';
import { UserRole } from '@app/shared';
import { AuthController } from '../controllers/AuthController.js';
import { AvailabilityController } from '../controllers/AvailabilityController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export function buildRouter(): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  router.post('/auth/login', (req, res, next) => {
    AuthController.login(req, res).catch(next);
  });

  router.post('/auth/change-password', authenticate(), (req, res, next) => {
    AuthController.changePassword(req, res).catch(next);
  });

  router.get('/exams/mine', authenticate(), requireRole(UserRole.Proctor), (req, res, next) => {
    AvailabilityController.listExams(req, res).catch(next);
  });

  router.post('/availability', authenticate(), requireRole(UserRole.Proctor), (req, res, next) => {
    AvailabilityController.submit(req, res).catch(next);
  });

  return router;
}
