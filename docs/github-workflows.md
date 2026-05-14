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

Before first use, enable Pages in the repository and choose **GitHub Actions** as the source.

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

## Workload Identity Federation setup

`deploy-gcp.yml` is designed so you do **not** need to store a long-lived GCP JSON key in GitHub.

Instead, configure Google Cloud Workload Identity Federation for GitHub Actions and grant the chosen service account permission to submit Cloud Builds and deploy Cloud Run resources.

At a minimum, the impersonated deployment service account needs permissions equivalent to the operations performed in `cloudbuild.yaml`.

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
