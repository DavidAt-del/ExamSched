# GCP Onboarding Guide

This guide is for the new repository owner who wants to connect the codebase to their own Google Cloud credentials and project with minimal friction.

## Prerequisites

- `gcloud` installed locally
- authenticated with the target Google account
- a selected project, or willingness to pass `--project-id`
- Terraform installed for infrastructure provisioning

Verify your current context:

```bash
gcloud auth list
gcloud config list
```

## Fast path

From the repository root:

```bash
npm install
npm run setup:gcp -- --project-id your-gcp-project-id
```

This generates:

- `infra/terraform.tfvars`
- `cloudbuild.substitutions.local.yaml`

The command automatically derives sensible names for:

- Artifact Registry repository
- Cloud Run API/web services
- service accounts
- Cloud SQL instance connection name
- VPC and subnet names
- Secret Manager secret names

## Using your current `gcloud` defaults

If your active `gcloud` project is already correct, the command can reuse it:

```bash
gcloud config set project your-gcp-project-id
gcloud config set compute/region us-central1
npm run setup:gcp
```

## Useful flags

```bash
npm run setup:gcp -- --project-id your-gcp-project-id --app-slug scheduler
npm run setup:gcp -- --project-id your-gcp-project-id --environment production
npm run setup:gcp -- --project-id your-gcp-project-id --enable-apis
npm run setup:gcp -- --project-id your-gcp-project-id --dry-run
```

### What the flags control

- `--project-id` — target GCP project
- `--region` — deployment region
- `--environment` — environment suffix such as `staging` or `production`
- `--app-slug` — product slug used to derive default names
- `--resource-prefix` — explicit override for shared resource names
- `--artifact-repo` — Artifact Registry repository id
- `--api-service-account-id` / `--web-service-account-id` — service account ids
- `--api-service-name` / `--web-service-name` — Cloud Run service names
- `--migration-job-name` — Cloud Run job name used for migrations
- `--enable-apis` — runs `gcloud services enable` for required APIs
- `--dry-run` — prints the generated files instead of writing them

## Provisioning after bootstrap

```bash
cd infra
terraform init
terraform workspace new staging
terraform plan
terraform apply
terraform output
```

Use the Terraform outputs to validate the generated names and to wire Cloud Build.

## Secrets required after Terraform

Add secret versions for:

- `JWT_SECRET`
- `SENDGRID_API_KEY`
- `EMAIL_FROM`

The exact secret ids come from:

```bash
terraform output
```

## Cloud Build trigger handoff

Start from the generated file:

```bash
cloudbuild.substitutions.local.yaml
```

or the checked-in example:

```bash
cloudbuild.substitutions.example.yaml
```

Apply those substitution values to the target project's Cloud Build trigger.

## GitHub Actions deployment option

This repository also includes GitHub Actions workflows under `/.github/workflows/`:

- `ci.yml` — validation on pushes and pull requests
- `docs.yml` — publishes `docs/reference/html/` to GitHub Pages
- `deploy-gcp.yml` — manual deploy to GCP by submitting `cloudbuild.yaml`

If you want GitHub to orchestrate deployments instead of relying only on a
native Cloud Build trigger, configure GitHub Environments and OIDC as described
in `docs/github-workflows.md`.

## Relationship to runtime `.env`

`npm run setup:gcp` prepares infrastructure and CI/CD configuration.

`apps/api/.env.example` is still the source of truth for local API runtime variables such as:

- database host/port/user/password/name
- JWT secret
- SendGrid configuration
- optional Secret Manager integration

For Cloud Run deployments, Terraform and Cloud Build provide those values through environment variables and Secret Manager instead of a checked-in `.env` file.

## Troubleshooting

### `Missing GCP project id`

Either pass the project explicitly:

```bash
npm run setup:gcp -- --project-id your-gcp-project-id
```

or set it in `gcloud`:

```bash
gcloud config set project your-gcp-project-id
```

### Wrong generated names

Regenerate with explicit overrides:

```bash
npm run setup:gcp -- \
  --project-id your-gcp-project-id \
  --app-slug scheduler \
  --environment production \
  --resource-prefix scheduler-production
```

### Want to preview without changing files

```bash
npm run setup:gcp -- --project-id your-gcp-project-id --dry-run
```
