#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) is required. Install: https://cli.github.com" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

PR_NUMBER="${1:-}"
if [[ -z "${PR_NUMBER}" ]]; then
  PR_NUMBER="$(gh pr view --json number --jq .number 2>/dev/null || true)"
fi

if [[ -z "${PR_NUMBER}" ]]; then
  echo "No PR number detected. Usage: scripts/open-preview.sh <pr_number>" >&2
  exit 1
fi

OWNER_REPO="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
OWNER="${OWNER_REPO%/*}"
REPO="${OWNER_REPO#*/}"
URL="https://${OWNER}.github.io/${REPO}/env/preview/pr-${PR_NUMBER}/"

echo "Preview URL: $URL"
if command -v open >/dev/null 2>&1; then
  open "$URL" || true
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL" || true
fi

