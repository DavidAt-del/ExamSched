import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// Loads required secrets from Secret Manager and overlays them into process.env.
// Cloud Run typically does this for us via env-from-secret bindings, so this is
// a fallback for advanced cases (rotation, multi-secret aggregation).
export async function loadSecrets(opts: {
  projectId: string;
  secretNames: string[];
}): Promise<Record<string, string>> {
  const client = new SecretManagerServiceClient();
  const out: Record<string, string> = {};
  for (const name of opts.secretNames) {
    const [version] = await client.accessSecretVersion({
      name: `projects/${opts.projectId}/secrets/${name}/versions/latest`,
    });
    const payload = version.payload?.data?.toString();
    if (!payload) {
      throw new Error(`Secret ${name} is empty`);
    }
    out[name] = payload;
  }
  return out;
}
