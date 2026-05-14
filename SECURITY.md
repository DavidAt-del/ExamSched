# Security Policy

## Reporting a vulnerability

If you discover a security issue in this project, please do **not** open a public issue with exploit details.

Instead:

1. contact the repository owner privately
2. include reproduction details, impact, and any suggested remediation
3. allow reasonable time for triage and a fix before public disclosure

If this repository is transferred to a new owner, they should update this policy with their preferred private contact method.

## What to avoid committing

Never commit:

- real API keys or service-account keys
- real JWT secrets
- production database passwords
- organization-internal email addresses or local filesystem paths
- Cloud Build trigger values that expose private identifiers unless they are intentionally public

## Project-specific notes

- local development uses placeholder credentials documented in `apps/api/.env.example`
- Cloud Run production secrets are expected to come from Secret Manager
- `npm run setup:gcp` generates local bootstrap files for a target project; review them before sharing or publishing screenshots
- the repository uses `.gitleaks.toml` to keep secret scanning noisy on real leaks while allowing known-safe demo/test placeholders

## Maintainer checklist before publishing

- verify `.env` files with real values are ignored and not staged
- run the repository quality gates
- run the GCP bootstrap helper in `--dry-run` mode to inspect generated values
- confirm documentation does not contain private account details
- rotate any credentials that were ever used outside local demo/test contexts

