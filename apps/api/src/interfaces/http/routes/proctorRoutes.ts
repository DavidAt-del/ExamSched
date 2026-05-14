import { Router } from 'express';
import { UserRole } from '@app/shared';
import { AvailabilityController } from '../controllers/AvailabilityController.js';
import { ProctorController } from '../controllers/ProctorController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { wrap } from './route-utils.js';

/**
 * Builds the proctor-facing availability and schedule routes.
 */
export function buildProctorRoutes(): Router {
  const router = Router();

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

  const proctor = Router();
  proctor.use(authenticate(), requireRole(UserRole.Proctor));
  proctor.get('/my-periods', wrap(ProctorController.myPeriods));
  proctor.get('/my-schedule', wrap(ProctorController.mySchedule));

  router.use('/proctor', proctor);

  return router;
}

