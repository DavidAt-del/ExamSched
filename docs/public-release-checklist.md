# Public Release Checklist

Use this checklist before publishing the repository under a new GitHub account or making it broadly public.

## Repository hygiene

- [ ] Choose and add a project license
- [ ] Review repository name, description, and topics in GitHub
- [ ] Confirm default branch protections and review settings
- [ ] Remove or archive any remaining internal-only notes
- [ ] Verify `.gitignore` covers local bootstrap files and real `.env` files

## Documentation

- [ ] `README.md` reflects the current product and setup flow
- [ ] `docs/gcp-onboarding.md` matches the current bootstrap helper behavior
- [ ] `docs/publishing-to-new-owner.md` matches the current transfer process
- [ ] `docs/seeding.md` matches supported seed flags and profiles
- [ ] HTML docs can be regenerated with `npm run docs:api`

## Security and secrets

- [ ] Review tracked files for private paths, emails, and account-specific identifiers
- [ ] Ensure only placeholder credentials appear in docs and examples
- [ ] Confirm Secret Manager is used for production secrets
- [ ] Review `.gitleaks.toml` allowlist entries and keep them narrow
- [ ] Run secret scanning in CI before release

## GCP and deployment

- [ ] Run `npm run setup:gcp -- --project-id <target-project> --dry-run`
- [ ] Review generated naming for Terraform and Cloud Build
- [ ] Confirm `infra/terraform.tfvars.example` is still accurate
- [ ] Confirm `cloudbuild.substitutions.example.yaml` is still accurate
- [ ] Document any project-specific prerequisites outside the repo if needed

## Validation

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test:unit`
- [ ] `npm run build`
- [ ] `npm run docs:api`
- [ ] optional: `npm run test:integration`
- [ ] optional: `npm --workspace @app/web run test:e2e`

## Release notes for the new owner

- [ ] Share the required GCP APIs list from `infra/README.md`
- [ ] Share the initial Terraform apply workflow
- [ ] Share the Cloud Build trigger substitution workflow
- [ ] Share how to seed local demo and mocker datasets
- [ ] Share how to regenerate docs and run the main quality gates

