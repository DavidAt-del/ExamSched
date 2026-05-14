# Infrastructure

Terraform definitions for staging and production environments.

## Bootstrap

Generate local transfer files from your current `gcloud` credentials/project:

```bash
npm run setup:gcp -- --project-id your-gcp-project-id
```

Then provision infrastructure:

```bash
cd infra
terraform init
terraform workspace new staging   # or production
terraform plan
terraform apply
```

`terraform.tfvars.example` includes the transfer-oriented naming inputs used when
moving the repo to a different GCP project. `terraform.tfvars` is already
ignored by git.

## Transfer-friendly variables

The Terraform module now exposes naming overrides so a new owner can keep the
codebase unchanged while fitting a different GCP naming scheme:

- `app_slug`
- `resource_prefix`
- `artifact_registry_repository_id`
- `database_name`
- `api_service_account_id`
- `web_service_account_id`
- `api_service_name`
- `web_service_name`
- `db_iam_user`
- `github_repository`
- `github_actions_service_account_id`

After `terraform apply`, run `terraform output` and use the emitted values when
configuring Cloud Build substitutions in the target GCP project.

Terraform intentionally does **not** create the Cloud Run services. Cloud Build
creates and updates them after real container images exist and after Secret
Manager versions are populated.

## Required APIs

Enable before `apply`:

- run.googleapis.com
- sqladmin.googleapis.com
- secretmanager.googleapis.com
- artifactregistry.googleapis.com
- servicenetworking.googleapis.com
- cloudbuild.googleapis.com
- compute.googleapis.com
- iam.googleapis.com
- iamcredentials.googleapis.com

## Secrets to populate in Secret Manager

After `terraform apply`, create secret versions before the first Cloud Run deployment:

| Secret name                          | Bound env var      | Description                                                                   |
| ------------------------------------ | ------------------ | ----------------------------------------------------------------------------- |
| `<resource-prefix>-jwt-secret`       | `JWT_SECRET`       | Symmetric JWT signing key (HS256). Min 32 bytes random, rotate every 90 days. |
| `<resource-prefix>-sendgrid-api-key` | `SENDGRID_API_KEY` | SendGrid API key for proctor schedule email notifications.                    |
| `<resource-prefix>-email-from`       | `EMAIL_FROM`       | Sender address for outbound mail (e.g. `no-reply@proctor.example.ac.il`).     |

Populate via `gcloud secrets versions add <jwt-secret-name> --data-file=<file>`.
The exact secret ids come from `terraform output` and the Cloud Run service
binds them via `value_source.secret_key_ref` in `cloud-run.tf`. IAM grants are
declared in `iam.tf` (`roles/secretmanager.secretAccessor` on each secret for
the API service account).

## Cloud Build handoff

Use `../cloudbuild.substitutions.example.yaml` as the starting point for the new
project's Cloud Build trigger. The substitution values should match the names
emitted by `terraform output`.

## GitHub Actions deployment

Terraform also provisions the Workload Identity Federation resources required by
`.github/workflows/deploy-gcp.yml`:

- a GitHub OIDC Workload Identity Pool and Provider
- a `github-actions-<environment>` deployment service account
- permission for `github_repository` to impersonate that service account
- deploy permissions for the Cloud Build service account used by
  `cloudbuild.yaml`

After `terraform apply`, use these outputs as GitHub Environment variables:

| Terraform output                            | GitHub variable                  |
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

Set these manually alongside the outputs:

- `GCP_PROJECT_ID` — target project id
- `GCP_REGION` — target region
