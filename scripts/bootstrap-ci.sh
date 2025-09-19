#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then echo "Install GitHub CLI: https://cli.github.com"; exit 1; fi
if ! gh auth status -h github.com >/dev/null 2>&1; then echo "Run: gh auth login"; exit 1; fi

REMOTE="$(git config --get remote.origin.url || true)"
if [[ -z "$REMOTE" ]]; then echo "No git remote found. Add one before bootstrapping."; exit 1; fi
OWNER_REPO="$(echo "$REMOTE" | sed -E 's#.*github.com[/:]##; s#\.git$##')"
OWNER="${OWNER_REPO%/*}"; REPO="${OWNER_REPO#*/}"

for E in dev qa stage prod; do gh api -X PUT "repos/$OWNER/$REPO/environments/$E" -f wait_timer=0 >/dev/null || true; done
( gh api -X POST "repos/$OWNER/$REPO/pages" -f "source[branch]=gh-pages" -f "source[path]=/" >/dev/null ) || \
( gh api -X PUT  "repos/$OWNER/$REPO/pages" -f "source[branch]=gh-pages" -f "source[path]=/" >/dev/null )

if ! git ls-remote --exit-code --heads origin gh-pages >/dev/null 2>&1; then
  TMPDIR="$(mktemp -d)"; pushd "$TMPDIR" >/dev/null
  git init -q
  git remote add origin "https://github.com/$OWNER/$REPO.git"
  git checkout -q -b gh-pages
  printf '<!doctype html><title>Build Catalog</title><p>Waiting for first deploy...'> index.html
  git -c user.name=bootstrap -c user.email=bootstrap@noreply add index.html
  git -c user.name=bootstrap -c user.email=bootstrap@noreply commit -m "chore: seed gh-pages"
  git push -q origin gh-pages
  popd >/dev/null; rm -rf "$TMPDIR"
fi

gh workflow run validate-settings.yml -f code_owner=@flashesofbrilliance || true
gh workflow run pin-actions.yml || true
echo "Pages: https://$OWNER.github.io/$REPO/"

