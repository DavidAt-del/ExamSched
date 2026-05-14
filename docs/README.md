# Documentation

This directory holds project documentation that is useful for maintainers but does not need to live in the repository root.

## Structure

- `archive/` — historical implementation reports, audit notes, and handoff documents retained for reference.
- `developer-guide.md` — maintainer-oriented architecture and documentation conventions.
- `github-workflows.md` — GitHub Actions, Pages, and GCP deployment environment setup.
- `gcp-onboarding.md` — operator guide for wiring the repo into a new GCP account and project.
- `publishing-to-new-owner.md` — GitHub transfer + GCP migration checklist for moving the repo to a new owner/account.
- `public-release-checklist.md` — final audit list before publishing the repository publicly.
- `release-deployment-graph.md` — operator runbook for the full CI → seeded Cloud SQL → Cloud Run deployment graph.
- `seeding.md` — deterministic local seeding profiles and CLI flags.

Generated HTML reference docs are produced locally at `docs/reference/html/` via `npm run docs:api`.

Repository-wide contribution and security policies live at the root in `CONTRIBUTING.md` and `SECURITY.md`.

For day-to-day setup and usage, start with the root `README.md`.
