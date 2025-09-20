#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) is required. Install: https://cli.github.com" >&2
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "Error: git not found" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

REMOTE="$(git remote 2>/dev/null | head -n1 || true)"
if [[ -z "${REMOTE}" ]]; then
  echo "No git remote found. Add one (e.g., origin) before running preview." >&2
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" == "HEAD" ]]; then
  echo "Detached HEAD. Please checkout a branch." >&2
  exit 1
fi

echo "Using branch: $BRANCH"

# Ensure branch is pushed
git push -u "$REMOTE" "$BRANCH" >/dev/null 2>&1 || true

# Get or create PR
PR_NUMBER="$(gh pr view --json number --jq .number 2>/dev/null || true)"
if [[ -z "${PR_NUMBER:-}" ]]; then
  echo "No PR found; creating one against main…"
  gh pr create -B main -t "Preview: $BRANCH" -b "Automated preview for $BRANCH" >/dev/null
  PR_NUMBER="$(gh pr view --json number --jq .number)"
fi

echo "PR #$PR_NUMBER detected. Triggering preview workflow…"

# Manually trigger preview (optional; PR event usually triggers automatically)
gh workflow run preview.yml -f pr_number="$PR_NUMBER" >/dev/null || true

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

