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
