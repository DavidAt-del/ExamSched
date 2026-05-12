# Infrastructure

Terraform definitions for staging and production environments.

## Bootstrap

```bash
cd infra
terraform init
terraform workspace new staging   # or production
terraform plan -var "project_id=<gcp-project>" -var "db_iam_user=api-staging@<gcp-project>.iam"
terraform apply
```

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

| Secret name                      | Bound env var      | Description                                                                   |
|----------------------------------|--------------------|-------------------------------------------------------------------------------|
| `proctor-<env>-jwt-secret`       | `JWT_SECRET`       | Symmetric JWT signing key (HS256). Min 32 bytes random, rotate every 90 days. |
| `proctor-<env>-sendgrid-api-key` | `SENDGRID_API_KEY` | SendGrid API key for proctor schedule email notifications.                    |
| `proctor-<env>-email-from`       | `EMAIL_FROM`       | Sender address for outbound mail (e.g. `no-reply@proctor.example.ac.il`).     |

Populate via `gcloud secrets versions add proctor-<env>-jwt-secret --data-file=<file>`. The Cloud Run service binds them via `value_source.secret_key_ref` in `cloud-run.tf`. IAM grants are declared in `iam.tf` (`roles/secretmanager.secretAccessor` on each secret for the API service account).

