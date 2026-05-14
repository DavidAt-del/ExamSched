#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const OUTPUT_TO_VARIABLE = {
  github_actions_workload_identity_provider: 'GCP_WORKLOAD_IDENTITY_PROVIDER',
  github_actions_service_account_email: 'GCP_SERVICE_ACCOUNT',
  artifact_registry_repository_id: 'GCP_AR_REPO',
  database_name: 'GCP_DB_NAME',
  api_service_account_id: 'GCP_API_SERVICE_ACCOUNT_ID',
  web_service_account_id: 'GCP_WEB_SERVICE_ACCOUNT_ID',
  api_service_name: 'GCP_API_SERVICE_NAME',
  web_service_name: 'GCP_WEB_SERVICE_NAME',
  migration_job_name: 'GCP_MIGRATION_JOB_NAME',
  vpc_name: 'GCP_VPC_NAME',
  subnet_name: 'GCP_SUBNET_NAME',
  jwt_secret_name: 'GCP_JWT_SECRET_NAME',
  sendgrid_secret_name: 'GCP_SENDGRID_SECRET_NAME',
  email_from_secret_name: 'GCP_EMAIL_FROM_SECRET_NAME',
  cloud_sql_instance_connection_name: 'GCP_CLOUD_SQL_INSTANCE',
};

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  console.log(
    `Sync Terraform outputs into GitHub Environment variables.\n\nUsage:\n  npm run sync:github-env -- --repo DavidAt-del/ExamSched --environment staging --project-id project-id --region us-central1\n\nOptions:\n  --repo <owner/repo>      GitHub repository to update. Defaults to the current git remote.\n  --environment <name>    GitHub Environment and Terraform workspace. Defaults to staging.\n  --project-id <id>       GCP project id for GCP_PROJECT_ID. Defaults to gcloud config.\n  --region <region>       GCP region for GCP_REGION. Defaults to gcloud config or us-central1.\n  --infra-dir <path>      Terraform/OpenTofu directory. Defaults to ./infra.\n  --tool <terraform|tofu>  IaC CLI to read outputs. Defaults to terraform, then tofu.\n  --dry-run               Print planned variable writes without calling gh.\n`,
  );
  process.exit(0);
}

const workspaceRoot = path.resolve(import.meta.dirname, '..');
const infraDir = path.resolve(workspaceRoot, args['infra-dir'] ?? 'infra');
const environment = args.environment ?? 'staging';
const repo = args.repo ?? detectGitHubRepo(workspaceRoot);
const projectId = args['project-id'] ?? safeExec('gcloud', ['config', 'get-value', 'project']);
const region =
  args.region ?? safeExec('gcloud', ['config', 'get-value', 'compute/region']) ?? 'us-central1';
const tool = args.tool ?? detectIaCTool();
const dryRun = args['dry-run'] === true;

if (!repo)
  fail('Missing --repo <owner/repo> and could not infer a GitHub repository from git remote.');
if (!projectId) fail('Missing --project-id <id> and could not read gcloud config project.');
if (!existsSync(infraDir)) fail(`Infra directory not found: ${infraDir}`);

console.log(`Syncing GitHub Environment variables`);
console.log(`  repo:        ${repo}`);
console.log(`  environment: ${environment}`);
console.log(`  project:     ${projectId}`);
console.log(`  region:      ${region}`);
console.log(`  infra:       ${infraDir}`);
console.log(`  tool:        ${tool}`);
console.log('');

selectWorkspace(tool, infraDir, environment);
const outputs = readOutputs(tool, infraDir);
const variables = {
  GCP_PROJECT_ID: projectId,
  GCP_REGION: region,
};

for (const [outputName, variableName] of Object.entries(OUTPUT_TO_VARIABLE)) {
  const output = outputs[outputName];
  const value = output?.value;
  if (value === undefined || value === null || value === '') {
    fail(
      `Terraform output ${outputName} is missing or empty; run ${tool} apply in ${infraDir} first.`,
    );
  }
  variables[variableName] = String(value);
}

if (dryRun) {
  for (const [name, value] of Object.entries(variables)) {
    console.log(`${name}=${value}`);
  }
  process.exit(0);
}

ensureEnvironment(repo, environment);
for (const [name, value] of Object.entries(variables)) {
  setVariable(repo, environment, name, value);
}

console.log('');
console.log(`✅ Synced ${Object.keys(variables).length} variables to ${repo} / ${environment}.`);

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const [rawKey, inlineValue] = token.slice(2).split('=', 2);
    const next = argv[index + 1];
    const value = inlineValue ?? (next && !next.startsWith('--') ? next : true);
    if (inlineValue === undefined && next && !next.startsWith('--')) index += 1;
    parsed[rawKey] = value;
  }
  return parsed;
}

function detectGitHubRepo(cwd) {
  const remote = safeExec('git', ['-C', cwd, 'remote', 'get-url', 'origin']);
  if (!remote) return undefined;
  const match = remote.match(/github\.com[:/](?<owner>[^/]+)\/(?<repo>[^/.]+)(?:\.git)?$/u);
  if (!match?.groups) return undefined;
  return `${match.groups.owner}/${match.groups.repo}`;
}

function detectIaCTool() {
  if (commandExists('terraform')) return 'terraform';
  if (commandExists('tofu')) return 'tofu';
  fail('Neither terraform nor tofu was found on PATH.');
}

function commandExists(command) {
  try {
    execFileSync('bash', ['-lc', `command -v ${shellQuote(command)} >/dev/null`], {
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function selectWorkspace(toolName, cwd, workspace) {
  try {
    execFileSync(toolName, ['-chdir=' + cwd, 'workspace', 'select', workspace], {
      stdio: 'inherit',
    });
  } catch {
    fail(
      `Could not select ${toolName} workspace ${workspace}. Create/apply it before syncing GitHub variables.`,
    );
  }
}

function readOutputs(toolName, cwd) {
  try {
    const raw = execFileSync(toolName, ['-chdir=' + cwd, 'output', '-json'], { encoding: 'utf8' });
    return JSON.parse(raw);
  } catch (error) {
    fail(
      `Could not read ${toolName} outputs from ${cwd}: ${error instanceof Error ? error.message : error}`,
    );
  }
}

function ensureEnvironment(repository, envName) {
  execFileSync('gh', ['api', '--method', 'PUT', `/repos/${repository}/environments/${envName}`], {
    stdio: 'inherit',
  });
}

function setVariable(repository, envName, name, value) {
  execFileSync(
    'gh',
    ['variable', 'set', name, '--repo', repository, '--env', envName, '--body', value],
    {
      stdio: 'inherit',
    },
  );
}

function safeExec(command, argv) {
  try {
    const stdout = execFileSync(command, argv, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return stdout && stdout !== '(unset)' ? stdout : undefined;
  } catch {
    return undefined;
  }
}

function shellQuote(value) {
  return `'${value.replace(/'/gu, `'\\''`)}'`;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
