# Publishing to a New GitHub Owner and GCP Project

This guide prepares the repository for transfer to another GitHub account and deployment into a different GCP project without changing application code.

## Checklist

### GitHub ownership transfer
- Create the destination repository under the new GitHub owner.
- Push this repository to the new remote.
- Recreate branch protections, reviewers, and any repository secrets outside this codebase.
- Reconfigure any external integrations that pointed at the old repository URL.

### GCP bootstrap
- Create a new GCP project.
- Enable the APIs listed in `infra/README.md`.
- Run `npm run setup:gcp -- --project-id <new-project-id>` from the repository root.
- Review the generated `infra/terraform.tfvars` and `cloudbuild.substitutions.local.yaml`.
- Run Terraform from `infra/`.
- Populate Secret Manager values for the created secrets.
- Create a Cloud Build trigger and apply substitutions from `cloudbuild.substitutions.local.yaml` or `cloudbuild.substitutions.example.yaml`.

## Files added for transfer

- `infra/terraform.tfvars.example` — example Terraform inputs for the target project.
- `cloudbuild.substitutions.example.yaml` — example Cloud Build trigger substitutions.
- `infra/outputs.tf` — outputs the resource names that Cloud Build and operators need after `terraform apply`.

## Recommended transfer flow

### 1. Provision infrastructure in the new project

```bash
npm run setup:gcp -- --project-id your-gcp-project-id

cd infra
terraform init
terraform workspace new staging
terraform plan
terraform apply
```

After apply, collect the generated names:

```bash
terraform output
```

Use the outputs to fill in the Cloud Build trigger substitutions.

If the new owner already authenticated with `gcloud`, `npm run setup:gcp` can
reuse the active account, project, and configured region automatically. Add
`--enable-apis` if you want the helper to run `gcloud services enable` for the
required APIs before Terraform.

### 2. Create the required secret versions

At minimum, add versions for:
- JWT signing secret
- SendGrid API key
- sender email address

Use the secret ids returned by `terraform output`.

### 3. Configure Cloud Build in the new project

The pipeline in `cloudbuild.yaml` is now parameterized. Set the trigger substitutions to match the new project's Terraform outputs:
- Artifact Registry repository id
- database name
- API service-account id
- API / web service names
- migration job name
- VPC / subnet names
- Secret Manager secret names
- Cloud SQL instance connection name

## Notes

- The application defaults still use `proctor_scheduler` locally. That is fine for local development and tests.
- You only need to change naming inputs if the new owner wants different GCP resource names.
- `npm run setup:gcp -- --dry-run` prints the generated Terraform and Cloud Build files without writing them.
- The root `README.md` stays product-facing; operational transfer details live here so the repository root remains clean.
- Before making the repository public, walk through `docs/public-release-checklist.md` and `SECURITY.md`.

