import 'express-async-errors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { pinoHttp } from 'pino-http';
import pino from 'pino';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { loadEnv } from '../../config/env.js';
import { buildRouter } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestIdMiddleware, REQUEST_ID_HEADER } from './middleware/requestId.js';

export function buildApp(): Express {
  const env = loadEnv();
  const app = express();

  const logger = pino({ level: env.LOG_LEVEL });
  app.use(
    pinoHttp({
      logger,
      customProps: (_req: IncomingMessage, res: ServerResponse) => ({
        requestId: res.getHeader(REQUEST_ID_HEADER),
      }),
    }),
  );

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(requestIdMiddleware());
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
      credentials: false,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '256kb' }));

  app.use('/api', buildRouter());

  app.use(errorHandler);
  return app;
}
