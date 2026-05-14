import { Router } from 'express';
import multer from 'multer';
import { UserRole } from '@app/shared';
import { AdminController } from '../controllers/AdminController.js';
import { SchedulingController } from '../controllers/SchedulingController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { wrap } from './route-utils.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/**
 * Builds the admin and exam-staff routes, including proctor CRUD, period
 * management, scheduling, exports, and audit log access.
 */
export function buildAdminRoutes(): Router {
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

  admin.get('/users', wrap(AdminController.listStaffUsers));
  admin.post('/users/:id/reset-password', wrap(AdminController.resetStaffPassword));

  admin.get('/audit-log', requireRole(UserRole.Admin), wrap(AdminController.listAuditLog));

  admin.get('/periods/:periodId/notification-log', wrap(AdminController.listNotificationLog));

  admin.post('/periods/:periodId/schedule', wrap(SchedulingController.run));
  admin.get('/periods/:periodId/schedule', wrap(SchedulingController.view));
  admin.get('/periods/:periodId/schedule/export', wrap(SchedulingController.exportSchedule));
  admin.post('/periods/:periodId/send-schedule', wrap(SchedulingController.sendSchedule));
  admin.patch('/exams/:examId/classrooms/:idx', wrap(SchedulingController.manualOverride));
  admin.get('/exams/:examId/availability', wrap(SchedulingController.examAvailability));

  return admin;
}

