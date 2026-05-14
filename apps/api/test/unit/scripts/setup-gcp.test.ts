import { describe, expect, it } from 'vitest';
import {
  renderCloudBuildSubstitutions,
  renderTerraformTfvars,
  resolveSetupOptions,
} from '../../../scripts/setup-gcp.js';

describe('setup-gcp bootstrap helper', () => {
  it('derives transfer-safe defaults from the project and environment', () => {
    const options = resolveSetupOptions(['--project-id', 'demo-project'], {});

    expect(options.projectId).toBe('demo-project');
    expect(options.region).toBe('us-central1');
    expect(options.environment).toBe('staging');
    expect(options.resourcePrefix).toBe('proctor-staging');
    expect(options.cloudSqlInstance).toBe('demo-project:us-central1:proctor-staging-pg');
    expect(options.dbIamUser).toBe('api-staging@demo-project.iam');
  });

  it('renders terraform and cloud build files with the derived values', () => {
    const options = resolveSetupOptions(
      ['--project-id', 'demo-project', '--app-slug', 'scheduler', '--environment', 'production'],
      { region: 'europe-west1' },
    );

    const tfvars = renderTerraformTfvars(options);
    const substitutions = renderCloudBuildSubstitutions(options);

    expect(tfvars).toContain('project_id = "demo-project"');
    expect(tfvars).toContain('resource_prefix = "scheduler-production"');
    expect(substitutions).toContain('_REGION: europe-west1');
    expect(substitutions).toContain('_CLOUD_SQL_INSTANCE: demo-project:europe-west1:scheduler-production-pg');
    expect(substitutions).toContain('_JWT_SECRET_NAME: scheduler-production-jwt-secret');
  });
});
