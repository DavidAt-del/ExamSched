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

After `terraform apply`, run `terraform output` and use the emitted values when
configuring Cloud Build substitutions in the target GCP project.

## Required APIs

Enable before `apply`:
- run.googleapis.com
- sqladmin.googleapis.com
- secretmanager.googleapis.com
- artifactregistry.googleapis.com
- servicenetworking.googleapis.com
- cloudbuild.googleapis.com
- compute.googleapis.com

## Secrets to populate in Secret Manager

After `terraform apply`, create secret versions before the first Cloud Run deployment:

| Secret name                            | Bound env var      | Description                                                                   |
|----------------------------------------|--------------------|-------------------------------------------------------------------------------|
| `<resource-prefix>-jwt-secret`         | `JWT_SECRET`       | Symmetric JWT signing key (HS256). Min 32 bytes random, rotate every 90 days. |
| `<resource-prefix>-sendgrid-api-key`   | `SENDGRID_API_KEY` | SendGrid API key for proctor schedule email notifications.                    |
| `<resource-prefix>-email-from`         | `EMAIL_FROM`       | Sender address for outbound mail (e.g. `no-reply@proctor.example.ac.il`).     |

Populate via `gcloud secrets versions add <jwt-secret-name> --data-file=<file>`.
The exact secret ids come from `terraform output` and the Cloud Run service
binds them via `value_source.secret_key_ref` in `cloud-run.tf`. IAM grants are
declared in `iam.tf` (`roles/secretmanager.secretAccessor` on each secret for
the API service account).

## Cloud Build handoff

Use `../cloudbuild.substitutions.example.yaml` as the starting point for the new
project's Cloud Build trigger. The substitution values should match the names
emitted by `terraform output`.

