# Deployment Strategy & Environment Management

## Overview
This project uses a progressive deployment strategy across four environments:
- **dev**: Feature development and initial testing
- **qa**: Quality assurance testing and validation  
- **stage**: Production-like environment for final testing
- **prod**: Production environment for live users

## Version Strategy

### Semantic Versioning
We use [semantic versioning](https://semver.org/) with the following format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes or major feature releases
- **MINOR**: New features, backwards compatible
- **PATCH**: Bug fixes, small improvements

### Version Tags
- `v1.0.0`: Production releases
- `v1.0.0-rc.1`: Release candidates for staging
- `v1.0.0-beta.1`: Beta versions for QA testing
- `v1.0.0-alpha.1`: Alpha versions for dev testing

## Environment Deployment Strategy

### Progressive Deployment Flow
```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│   dev   │───▶│   qa    │───▶│  stage  │───▶│  prod   │
│ feature │    │ testing │    │ staging │    │  live   │
│branches │    │ main +  │    │ release │    │ tagged  │
│         │    │ merges  │    │candidates│    │versions │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
```

### Deployment Triggers

#### Automatic Deployments
- **dev**: `feat/*` branches → `env/dev/{branch-name}`
- **qa**: `main` branch pushes → `env/qa/main-{short-sha}`
- **stage**: Release candidate tags (`v*-rc*`) → `env/stage/{tag}`
- **prod**: Version tags (`v*`) → `env/prod/{tag}`

#### Manual Promotions
Use the "Promote Artifact" workflow to promote builds between environments:
1. Go to Actions → "Promote Artifact (env -> env)"
2. Select source path (e.g., `env/qa/latest`)
3. Choose target environment
4. Optionally specify target build name

## Environment URLs

All environments are accessible via GitHub Pages:
- **Base URL**: `https://flashesofbrilliance.github.io/job-tracker-pro/`
- **dev**: `https://flashesofbrilliance.github.io/job-tracker-pro/env/dev/latest/`
- **qa**: `https://flashesofbrilliance.github.io/job-tracker-pro/env/qa/latest/`
- **stage**: `https://flashesofbrilliance.github.io/job-tracker-pro/env/stage/latest/`
- **prod**: `https://flashesofbrilliance.github.io/job-tracker-pro/env/prod/latest/`

## Change Management Process

### 1. Feature Development
1. Create feature branch: `feat/description-of-feature`
2. Develop and test locally
3. Push to trigger dev deployment
4. Verify in dev environment

### 2. Quality Assurance
1. Create PR to merge feature to `main`
2. PR triggers preview deployment
3. QA team tests preview environment
4. Address feedback, update PR
5. Merge to `main` triggers qa deployment

### 3. Staging Release
1. Create release branch: `release/v1.1.0`
2. Create release candidate tag: `v1.1.0-rc.1`
3. Triggers stage deployment
4. Perform final testing in stage
5. Fix any issues with additional RC tags

### 4. Production Release
1. Create final version tag: `v1.1.0`
2. Triggers prod deployment
3. Monitor production for issues
4. Document release in changelog

## Safety Measures

### Deployment Blockers
Promotions are blocked if there are open issues labeled:
- `blocker`: Critical issues that must be resolved
- `ac-fail`: Acceptance criteria failures

### Rollback Strategy
1. Use "Rollback Environment" workflow
2. Select environment and target version
3. Previous version is restored immediately

### File Integrity
All deployments include provenance files with SHA256 hashes to verify file integrity during promotions.

## Monitoring & Verification

### Build Catalog
View all deployments at: `https://flashesofbrilliance.github.io/job-tracker-pro/`

### Environment Status
Each environment shows:
- Current version/build name
- Deployment timestamp  
- Source commit SHA
- File integrity status

## Emergency Procedures

### Hotfix Process
1. Create hotfix branch from prod tag: `hotfix/critical-fix`
2. Fix issue and test locally
3. Create hotfix tag: `v1.0.1`
4. Deploy directly to prod
5. Backport fix to main and active release branches

### Rollback Process
1. Identify last known good version
2. Use rollback workflow or manual promotion
3. Verify rollback successful
4. Investigate and fix root cause
5. Plan forward fix deployment