import { Router } from 'express';
import { buildAdminRoutes } from './adminRoutes.js';
import { buildAuthRoutes } from './authRoutes.js';
import { buildProctorRoutes } from './proctorRoutes.js';

/**
 * Composes the full HTTP router tree exposed under `/api`.
 */
export function buildRouter(): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  router.use('/auth', buildAuthRoutes());
  router.use(buildProctorRoutes());
  router.use('/admin', buildAdminRoutes());

  return router;
}
