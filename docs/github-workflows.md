# GitHub Workflows and Environments

This repository ships with GitHub Actions workflows for validation, HTML docs publishing, GCP deployment, and workflow-run cleanup.

## Workflow graph

The repository is wired as a gradual promotion graph:

```text
pull_request / push
  -> CI
       -> static checks
       -> seed/bootstrap smoke
       -> unit tests
       -> integration tests
       -> build
       -> docs artifact

successful CI on main
  -> Publish docs

successful CI on develop or main
  -> Deploy to GCP (staging)

manual dispatch
  -> Deploy to GCP (staging or production)
  -> Cleanup workflow runs
```

## Included workflows

### `/.github/workflows/ci.yml`

Runs on pushes to `main` and `develop`, and on every pull request.

It performs the following gated jobs:

- `Static checks`: installs dependencies, then runs `npm run lint` and `npm run typecheck`
- `Seed and bootstrap smoke`: validates the seeding and GCP bootstrap CLIs with:
  - `npm run seed:mocker -- --help`
  - `npm run setup:gcp -- --help`
- `Unit tests`: runs `npm run test:unit`
- `Integration tests`: runs `npm run test:integration`
- `Build application`: runs `npm run build`
- `Generate docs artifact`: runs `npm run docs:api`

The generated TypeDoc site is uploaded as a workflow artifact named `api-reference-html`.

### `/.github/workflows/docs.yml`

Runs after successful `CI` runs on `main`, and manually via `workflow_dispatch`.

It checks out the exact commit SHA that triggered `CI`, builds the TypeDoc site,
and deploys `docs/reference/html/` to GitHub Pages.

The workflow asks `actions/configure-pages` to enable Pages automatically for a
new repository. If the repository settings or permissions still block that, use
the manual fallback:

1. open **Settings → Pages**
2. set **Source** to **GitHub Actions**
3. rerun the **Publish docs** workflow

### `/.github/workflows/deploy-gcp.yml`

GCP deployment workflow triggered by successful `CI` runs and manual dispatch.

It runs automatically after successful `CI` runs for:

- `develop` → `staging`
- `main` → `staging`

Production is intentionally manual-only. Select `production` from the Actions UI
and enter `deploy` in `confirm_production`.

It:

1. checks out the selected ref
2. validates that the target GitHub Environment contains all required GCP values
3. authenticates to Google Cloud using GitHub OIDC and Workload Identity Federation
4. submits the repository's `cloudbuild.yaml` pipeline with the correct substitutions

Automatic staging deployments submit `_SEED_PROFILE=demo` so Cloud Build runs a
deterministic Cloud SQL seed job after migrations. Manual dispatch adds a
`seed_profile` input with `none`, `demo`, `mocker`, and `load` choices.

When `environment=production`, non-`none` seed profiles require the additional
manual confirmation `confirm_seeded_production=seed-production`.

The workflow validates both `GCP_SENDGRID_SECRET_NAME` and
`GCP_EMAIL_FROM_SECRET_NAME`, and passes them through to `cloudbuild.yaml`,
which binds them to the API Cloud Run service as `SENDGRID_API_KEY` and
`EMAIL_FROM`.

Inside `cloudbuild.yaml`, the release flow is now:

1. secret scan, install, lint, typecheck, unit, integration, and e2e tests
2. build and push API/web images
3. run the migration Cloud Run Job against Cloud SQL
4. run the seed Cloud Run Job against Cloud SQL when `_SEED_PROFILE != none`
5. deploy the API service and run `/api/health` smoke checks
6. on staging seeded deploys, verify the seeded admin account can log in
7. deploy the web service and run a smoke check against the deployed site

Automatic deployments use the `staging` GitHub Environment variables.
Production deploys require the operator to type `deploy` into the
`confirm_production` input and should be protected with GitHub Environment
reviewers.

### `/.github/workflows/cleanup-runs.yml`

Maintenance workflow that deletes successful completed workflow runs older than a
retention window.

It runs:

- nightly on a schedule
- manually via `workflow_dispatch`

The manual inputs are:

- `retention_days`: defaults to `14`
- `dry_run`: defaults to `true`

Use the manual dispatch first in `dry_run` mode to confirm the runs that would be deleted.

## Recommended GitHub Environments

Create these GitHub Environments if you intend to deploy from Actions:

- `staging`
- `production`

Store the variables below in each environment.

## Required GitHub Environment variables

These are configured as **GitHub Environment variables** (`Settings → Environments → <env> → Variables`).

| Variable                         | Description                                                               |
| -------------------------------- | ------------------------------------------------------------------------- |
| `GCP_PROJECT_ID`                 | Target Google Cloud project id.                                           |
| `GCP_REGION`                     | Deployment region, for example `us-central1`.                             |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Full resource name of the Workload Identity Provider used by GitHub OIDC. |
| `GCP_SERVICE_ACCOUNT`            | Service account email that GitHub Actions impersonates for deployment.    |
| `GCP_AR_REPO`                    | Artifact Registry repository id used by `cloudbuild.yaml`.                |
| `GCP_DB_NAME`                    | Cloud SQL database name passed to migrations and API deploys.             |
| `GCP_API_SERVICE_ACCOUNT_ID`     | Short service-account id for the API workload, for example `api-staging`. |
| `GCP_WEB_SERVICE_ACCOUNT_ID`     | Short service-account id for the web workload, for example `web-staging`. |
| `GCP_API_SERVICE_NAME`           | Cloud Run API service name.                                               |
| `GCP_WEB_SERVICE_NAME`           | Cloud Run web service name.                                               |
| `GCP_MIGRATION_JOB_NAME`         | Cloud Run Job name used for migrations.                                   |
| `GCP_VPC_NAME`                   | VPC name for private egress to Cloud SQL.                                 |
| `GCP_SUBNET_NAME`                | Subnet name used by Cloud Run and the migration job.                      |
| `GCP_JWT_SECRET_NAME`            | Secret Manager secret id for the JWT secret.                              |
| `GCP_SENDGRID_SECRET_NAME`       | Secret Manager secret id for the SendGrid API key.                        |
| `GCP_EMAIL_FROM_SECRET_NAME`     | Secret Manager secret id for the sender email address.                    |
| `GCP_CLOUD_SQL_INSTANCE`         | Full Cloud SQL connection name, for example `project:region:instance`.    |

## Where those values come from

Use the repository bootstrap and Terraform flow first:

```bash
npm install
npm run setup:gcp -- --project-id your-gcp-project-id --enable-apis
cd infra
terraform init
terraform workspace select staging || terraform workspace new staging
terraform apply
terraform output
```

Then sync Terraform outputs into the GitHub Environment variables listed above:

```bash
npm run sync:github-env -- \
  --repo DavidAt-del/ExamSched \
  --environment staging \
  --project-id your-gcp-project-id \
  --region us-central1
```

Use `--dry-run` first if you want to preview values without writing to GitHub:

```bash
npm run sync:github-env -- --repo DavidAt-del/ExamSched --environment staging --dry-run
```

You can also map the Terraform outputs manually if needed.

Recommended output mapping:

| Terraform output                            | GitHub Environment variable      |
| ------------------------------------------- | -------------------------------- |
| `github_actions_workload_identity_provider` | `GCP_WORKLOAD_IDENTITY_PROVIDER` |
| `github_actions_service_account_email`      | `GCP_SERVICE_ACCOUNT`            |
| `artifact_registry_repository_id`           | `GCP_AR_REPO`                    |
| `database_name`                             | `GCP_DB_NAME`                    |
| `api_service_account_id`                    | `GCP_API_SERVICE_ACCOUNT_ID`     |
| `web_service_account_id`                    | `GCP_WEB_SERVICE_ACCOUNT_ID`     |
| `api_service_name`                          | `GCP_API_SERVICE_NAME`           |
| `web_service_name`                          | `GCP_WEB_SERVICE_NAME`           |
| `migration_job_name`                        | `GCP_MIGRATION_JOB_NAME`         |
| `vpc_name`                                  | `GCP_VPC_NAME`                   |
| `subnet_name`                               | `GCP_SUBNET_NAME`                |
| `jwt_secret_name`                           | `GCP_JWT_SECRET_NAME`            |
| `sendgrid_secret_name`                      | `GCP_SENDGRID_SECRET_NAME`       |
| `email_from_secret_name`                    | `GCP_EMAIL_FROM_SECRET_NAME`     |
| `cloud_sql_instance_connection_name`        | `GCP_CLOUD_SQL_INSTANCE`         |

Set `GCP_PROJECT_ID` and `GCP_REGION` from the selected GCP project and region.

## Workload Identity Federation setup

`deploy-gcp.yml` is designed so you do **not** need to store a long-lived GCP JSON key in GitHub.

Terraform in `infra/github-actions.tf` configures Google Cloud Workload Identity
Federation for GitHub Actions, creates the deployment service account, and grants
the Cloud Build service account the permissions needed by `cloudbuild.yaml`.

The default trusted repository is `DavidAt-del/ExamSched`. Override
`github_repository` in `infra/terraform.tfvars` if the repository is renamed or
transferred again.

## Push deploy flow

After Terraform has been applied and `npm run sync:github-env` has populated the
`staging` environment, deployment runs automatically only after `CI` succeeds on
`main` or `develop`.

The automatic path is:

1. `CI` validates the repository and produces the docs artifact
2. `Publish docs` regenerates GitHub Pages from TypeDoc when `main` passes `CI`
3. `Deploy to GCP` submits `cloudbuild.yaml` to Cloud Build using the `staging` environment variables when `main` or `develop` passes `CI`

## Manual deploy flow

1. open **Actions** in GitHub
2. select **Deploy to GCP**
3. choose `staging` or `production`
4. choose the git ref to deploy
5. if deploying to production, enter `deploy` in the confirmation field
6. run the workflow

## Relationship to Cloud Build

GitHub Actions is the orchestration layer.

Cloud Build remains the actual build/test/deploy pipeline for GCP because this repository already has a detailed and parameterized `cloudbuild.yaml` that:

- runs lint, typecheck, unit, integration, and e2e tests
- builds API and web images
- executes migrations
- deploys Cloud Run services

That keeps GitHub-side automation lightweight while reusing the existing GCP-native deployment flow.
