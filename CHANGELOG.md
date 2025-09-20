# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive deployment strategy documentation
- Pull request template for change management
- Progressive environment deployment workflow

### Fixed
- Bash history expansion issues in all GitHub Actions workflows

## [1.0.0] - 2025-09-20

### Added
- Job tracker application with complete UI
- Progressive CI/CD pipeline with four environments (dev/qa/stage/prod)
- Preview deployments for pull requests
- Environment promotion workflow with integrity checks
- Rollback capability for all environments
- File provenance tracking with SHA256 hashes
- Build catalog with deployment history
- GitHub Pages hosting for all environments

### Security
- File integrity verification for all promotions
- Deployment blocking for critical issues

### Infrastructure
- GitHub Actions workflows for automated deployments
- Semantic versioning strategy
- Environment-specific deployment URLs