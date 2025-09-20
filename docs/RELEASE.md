# FTL Release Management

This doc outlines our branching, release flow, and acceptance gates for Failure To Land (FTL).

## Branching
- `main`: production. Protected; requires PR, green checks, and environment approval to deploy.
- feature branches: `feat/<slug>` per change; open PRs to `main`.
- tags: `vX.Y.Z` for releases (Semantic Versioning).

## Preview Deploys (PR)
- Every PR builds and deploys a preview via GitHub Pages (actions/deploy-pages). The bot comments with the preview URL.
- Use this for UAT/QA before merge.

## Production Deploys
- Push to `main` triggers the production GitHub Pages workflow.
- The `github-pages` environment requires approval (environment protection) to publish.

## Acceptance Criteria & Gates
- PR template enforces AC checklist (acceptance criteria, screenshots/preview, QA checks).
- Required checks: lint, build.
- Optional: add E2E tests as we grow.

## Versioning & Releases
- Use SemVer (`vMAJOR.MINOR.PATCH`).
- Tag releases locally:
  ```bash
  npm version patch   # or minor / major
  git push --follow-tags
  ```
- Create a GitHub Release summarizing changes.

## Blockers & Defects
- Use Issues with labels:
  - `blocker`: forward-deploy blocker
  - `ac-fail`: acceptance criteria failure
  - `bug`: defects
- Link issues to PRs; do not merge w/ open `blocker`/`ac-fail` issues.

## Changelogs (optional)
- Add `standard-version` or `release-please` later to automate CHANGELOG.

## Branch Protection (configure in Settings)
- Require PRs to `main`.
- Require status checks to pass (lint, build).
- Require environment approval for `github-pages` deployment.

