import { describe, expect, it } from 'vitest';
import { resolveSeedGcpConfig } from '../../../scripts/seed-gcp.js';

describe('resolveSeedGcpConfig', () => {
  it('requires explicit Cloud SQL settings instead of local defaults', () => {
    expect(() => resolveSeedGcpConfig({})).toThrow(
      /Missing required GCP seed configuration/,
    );
  });

  it('returns the configured Cloud SQL instance, user, and database', () => {
    expect(
      resolveSeedGcpConfig({
        CLOUD_SQL_INSTANCE: 'my-project:us-central1:proctor-staging-pg',
        DB_USER: 'api-staging@my-project.iam',
        DB_NAME: 'proctor_scheduler',
      }),
    ).toEqual({
      instanceConnectionName: 'my-project:us-central1:proctor-staging-pg',
      user: 'api-staging@my-project.iam',
      database: 'proctor_scheduler',
    });
  });
});


