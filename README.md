# Job Tracker Pro (Fresh Start)

A clean, minimal job tracking web app you can run anywhere. Static HTML/CSS/JS with zero backend, easy to host on GitHub Pages.

## Quick Start

```bash
npm install
npm run dev      # http://127.0.0.1:3000
# or
npm run serve    # http://127.0.0.1:8080
```

## Features
- Simple table view of jobs
- Add/remove items in-memory (persist via Export/Import in a future step)
- Zero dependencies at runtime (only dev server)

## Scripts
- dev: live-reload dev server on port 3000
- serve: static server on port 8080
- bootstrap:ci: sets up GitHub Pages + Environments for deploys (requires gh CLI)
- setup-pipeline: fetches CI/CD workflows from the reference repo

## CI/CD
- Run to configure Environments + Pages:
```bash
npm run bootstrap:ci
```
- Then scaffold workflows from the reference project (optional):
```bash
npm run setup:pipeline
```

Add a remote and push when ready:
```bash
git remote add origin https://github.com/<owner>/job-tracker-pro.git
git push -u origin main
```
# Test run trigger
