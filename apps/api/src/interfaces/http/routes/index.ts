import { Router } from 'express';
import multer from 'multer';
import { UserRole } from '@app/shared';
import { AuthController } from '../controllers/AuthController.js';
import { AvailabilityController } from '../controllers/AvailabilityController.js';
import { AdminController } from '../controllers/AdminController.js';
import { SchedulingController } from '../controllers/SchedulingController.js';
import { ProctorController } from '../controllers/ProctorController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

// 10 MB cap for the proctor-import upload. Stored in memory; the request is
// rejected (413) if the cap is exceeded.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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
  const proctor = Router();
  proctor.use(authenticate(), requireRole(UserRole.Proctor));
  proctor.get('/my-periods', wrap(ProctorController.myPeriods));
  proctor.get('/my-schedule', wrap(ProctorController.mySchedule));
  router.use('/proctor', proctor);

  router.post(
    '/availability',
    authenticate(),
    requireRole(UserRole.Proctor),
    wrap(AvailabilityController.submit),
  );
  router.post(
    '/availability/finalize/:periodId',
    authenticate(),
    requireRole(UserRole.Proctor),
    wrap(ProctorController.finalize),
  );

  // ── Admin ──────────────────────────────────────────────────────────────
  const admin = Router();
  admin.use(authenticate(), requireRole(UserRole.Admin, UserRole.ExamStaff));

  admin.post('/proctors', wrap(AdminController.createProctor));
  admin.get('/proctors', wrap(AdminController.listProctors));
  admin.patch('/proctors/:id', wrap(AdminController.updateProctor));
  admin.delete('/proctors/:id', wrap(AdminController.deactivateProctor));
  admin.post('/proctors/:id/reset-password', wrap(AdminController.resetProctorPassword));
  admin.post('/proctors/import', upload.single('file'), wrap(AdminController.importProctors));

  admin.post('/periods', wrap(AdminController.createPeriod));
  admin.get('/periods', wrap(AdminController.listPeriods));
  admin.patch('/periods/:id/close', wrap(AdminController.closePeriod));

  admin.post('/periods/:periodId/exams', wrap(AdminController.createExam));
  admin.get('/periods/:periodId/exams', wrap(AdminController.listExams));
  admin.delete('/periods/:periodId/exams/:id', wrap(AdminController.deleteExam));

  // ── Staff users (exam_staff role) ──────────────────────────────────────
  admin.get('/users', wrap(AdminController.listStaffUsers));
  admin.post('/users/:id/reset-password', wrap(AdminController.resetStaffPassword));

  // ── Audit log ──────────────────────────────────────────────────────────
  admin.get('/audit-log', wrap(AdminController.listAuditLog));

  // ── Notification log ───────────────────────────────────────────────────
  admin.get(
    '/periods/:periodId/notification-log',
    wrap(AdminController.listNotificationLog),
  );

  // ── Scheduling ─────────────────────────────────────────────────────────
  admin.post('/periods/:periodId/schedule', wrap(SchedulingController.run));
  admin.get('/periods/:periodId/schedule', wrap(SchedulingController.view));
  admin.get(
    '/periods/:periodId/schedule/export',
    wrap(SchedulingController.exportSchedule),
  );
  admin.post(
    '/periods/:periodId/send-schedule',
    wrap(SchedulingController.sendSchedule),
  );
  admin.patch(
    '/exams/:examId/classrooms/:idx',
    wrap(SchedulingController.manualOverride),
  );
  admin.get('/exams/:examId/availability', wrap(SchedulingController.examAvailability));

  router.use('/admin', admin);

  return router;
}
