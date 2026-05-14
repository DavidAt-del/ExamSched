import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { authenticate } from '../middleware/auth.js';
import { wrap } from './route-utils.js';

/**
 * Builds the authentication routes used by login and forced password changes.
 */
export function buildAuthRoutes(): Router {
  const router = Router();

  router.post('/login', wrap(AuthController.login));
  router.post('/change-password', authenticate(), wrap(AuthController.changePassword));

  return router;
}

