import { Router } from 'express';
import { UserRole } from '@app/shared';
import { AuthController } from '../controllers/AuthController.js';
import { AvailabilityController } from '../controllers/AvailabilityController.js';
import { AdminController } from '../controllers/AdminController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const wrap =
  <Req, Res>(fn: (req: Req, res: Res) => Promise<void>) =>
  (req: Req, res: Res, next: (err?: unknown) => void): void => {
    fn(req, res).catch(next);
  };

export function buildRouter(): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // ── Auth ────────────────────────────────────────────────────────────────
  router.post('/auth/login', wrap(AuthController.login));
  router.post('/auth/change-password', authenticate(), wrap(AuthController.changePassword));

  // ── Proctor self-service ────────────────────────────────────────────────
  router.get(
    '/exams/mine',
    authenticate(),
    requireRole(UserRole.Proctor),
    wrap(AvailabilityController.listExams),
  );
  router.post(
    '/availability',
    authenticate(),
    requireRole(UserRole.Proctor),
    wrap(AvailabilityController.submit),
  );

  // ── Admin ──────────────────────────────────────────────────────────────
  const admin = Router();
  admin.use(authenticate(), requireRole(UserRole.Admin, UserRole.ExamStaff));

  admin.post('/proctors', wrap(AdminController.createProctor));
  admin.get('/proctors', wrap(AdminController.listProctors));
  admin.patch('/proctors/:id', wrap(AdminController.updateProctor));
  admin.delete('/proctors/:id', wrap(AdminController.deactivateProctor));
  admin.post('/proctors/:id/reset-password', wrap(AdminController.resetProctorPassword));

  admin.post('/periods', wrap(AdminController.createPeriod));
  admin.get('/periods', wrap(AdminController.listPeriods));
  admin.patch('/periods/:id/close', wrap(AdminController.closePeriod));

  admin.post('/periods/:periodId/exams', wrap(AdminController.createExam));
  admin.get('/periods/:periodId/exams', wrap(AdminController.listExams));
  admin.delete('/periods/:periodId/exams/:id', wrap(AdminController.deleteExam));

  router.use('/admin', admin);

  return router;
}
