import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  // Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_USER: z.string().default('app'),
  DB_PASSWORD: z.string().default('app'),
  DB_NAME: z.string().default('proctor_scheduler'),
  // When set, the API uses Cloud SQL Connector + IAM auth (no password).
  CLOUD_SQL_INSTANCE: z.string().optional(),

  // Auth
  JWT_SECRET: z.string().min(16).default('dev-only-secret-change-me-please-1234'),
  JWT_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 8),
  BCRYPT_COST: z.coerce.number().int().min(12).max(15).default(12),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Email
  SENDGRID_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default('no-reply@proctor-scheduler.local'),

  // GCP
  GCP_PROJECT_ID: z.string().optional(),
  USE_SECRET_MANAGER: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  // When true, the process applies migrations and exits without starting the
  // HTTP server. Used by the Cloud Run Job that runs migrations during deploy.
  RUN_MIGRATIONS_ONLY: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;
export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }
  cached = parsed.data;
  return cached;
}

// For tests
export function resetEnvCache(): void {
  cached = null;
}
