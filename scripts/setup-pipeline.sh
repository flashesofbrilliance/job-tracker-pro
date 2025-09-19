#!/usr/bin/env bash
set -euo pipefail

SRC_REPO="${SOURCE_REPO:-flashesofbrilliance/job-search-optimizer-v2}"
SRC_BRANCH="${BRANCH:-main}"
RAW="https://raw.githubusercontent.com/${SRC_REPO}/${SRC_BRANCH}"

mkdir -p .github/workflows .github/lighthouse scripts docs .ai

fetch(){ curl -fsSL "$RAW/$1" -o "$2"; }

for f in env-deploy.yml promote.yml preview.yml validate-settings.yml pin-actions.yml auto-install.yml auto-open-pr.yml container-publish.yml open-pr.yml; do
  fetch ".github/workflows/$f" ".github/workflows/$f" || true
done
fetch ".github/lighthouse/lighthouserc.json" ".github/lighthouse/lighthouserc.json" || true
fetch "lighthouse.budgets.json" "lighthouse.budgets.json" || true
fetch ".github/dependabot.yml" ".github/dependabot.yml" || true
for f in gen-brands-index.js validate-brands.js smoke.js postbuild-hash.js ftl.mjs install.sh bootstrap-ci.sh; do
  fetch "scripts/$f" "scripts/$f" || true
  chmod +x "scripts/$f" || true
done
fetch "Dockerfile" "Dockerfile" || true
fetch "AGENTS.md" "AGENTS.md" || true
fetch ".ai/ops.yml" ".ai/ops.yml" || true
fetch "docs/RELEASE.md" "docs/RELEASE.md" || true

echo "[done] Copied workflows and scripts. Review and commit changes."

