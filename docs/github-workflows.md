# GitHub Workflows and Environments

This repository ships with GitHub Actions workflows for validation, HTML docs publishing, and GCP deployment.

## Included workflows

### `/.github/workflows/ci.yml`

Runs on pushes to `main` and `develop`, and on every pull request.

It performs:

- `npm ci --workspaces --include-workspace-root --no-audit --no-fund`
- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:integration`
- `npm run build`
- `npm run docs:api`

The generated TypeDoc site is uploaded as a workflow artifact named `api-reference-html`.

### `/.github/workflows/docs.yml`

Runs on pushes to `main` and manually via `workflow_dispatch`.

It builds the TypeDoc site and deploys `docs/reference/html/` to GitHub Pages.

The workflow asks `actions/configure-pages` to enable Pages automatically for a
new repository. If the repository settings or permissions still block that, use
the manual fallback:

1. open **Settings → Pages**
2. set **Source** to **GitHub Actions**
3. rerun the **Publish docs** workflow

### `/.github/workflows/deploy-gcp.yml`

Manual deployment workflow triggered from the GitHub Actions UI.

It:

1. checks out the selected ref
2. validates that the target GitHub Environment contains all required GCP values
3. authenticates to Google Cloud using GitHub OIDC and Workload Identity Federation
4. submits the repository's `cloudbuild.yaml` pipeline with the correct substitutions

Production deploys require the operator to type `deploy` into the `confirm_production` input.

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

Then map the Terraform outputs and `cloudbuild.substitutions.local.yaml` values into the GitHub Environment variables listed above.

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
| `vpc_name`                                  | `GCP_VPC_NAME`                   |
| `subnet_name`                               | `GCP_SUBNET_NAME`                |
| `jwt_secret_name`                           | `GCP_JWT_SECRET_NAME`            |
| `sendgrid_secret_name`                      | `GCP_SENDGRID_SECRET_NAME`       |
| `email_from_secret_name`                    | `GCP_EMAIL_FROM_SECRET_NAME`     |

Set `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_MIGRATION_JOB_NAME`, and
`GCP_CLOUD_SQL_INSTANCE` from the same generated bootstrap values.

## Workload Identity Federation setup

`deploy-gcp.yml` is designed so you do **not** need to store a long-lived GCP JSON key in GitHub.

Terraform in `infra/github-actions.tf` configures Google Cloud Workload Identity
Federation for GitHub Actions, creates the deployment service account, and grants
the Cloud Build service account the permissions needed by `cloudbuild.yaml`.

The default trusted repository is `DavidAt-del/ExamSched`. Override
`github_repository` in `infra/terraform.tfvars` if the repository is renamed or
transferred again.

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
