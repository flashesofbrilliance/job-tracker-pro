# Working Agreement

Lightweight guide for how we collaborate and ship quickly.

## Branching & Commits
- Branch names: `feature/<topic>`, `fix/<issue>`, `chore/<task>`
- Commits: Conventional style (e.g., `feat(discover): add recommendations`)
- Small commits are encouraged; checkpoint commits are fine.

## PRs & Previews
- Open PRs early; keep scope tight (<= ~200 lines where possible)
- Preview URL: GitHub Action publishes to `gh-pages` at `env/preview/pr-<PR#>/`
- Use scripts for speed:
  - `npm run preview:pr` — push branch, create PR (if needed), trigger preview, open URL
  - `npm run preview:open` — open preview URL for current PR

## Local Dev
- Run locally: `npm run dev` (live server) or open `index.html`
- Build locally: `npm run build` (writes to `dist/`)

## Communication
- Progress updates: short, action-focused notes when a step is completed (e.g., “Discover UI in, wiring analytics next”)
- Blockers: call out immediately with a clear unblocking option (e.g., exact command needing network access)
- Decisions: propose minimal diffs first, wait for acknowledgement on UX/data model changes

## Approvals
- Ask before: network access, destructive git ops, adding new dependencies, large refactors
- Safe defaults: local-first storage, no external calls unless explicitly requested

## Definition of Done
- Builds locally (`npm run build`) and previews via Actions
- No console errors in the browser
- Changes are documented briefly in PR description

## Housekeeping
- Keep `docs/TODO.md` updated (Now / Next / Later)
- Prefer iterative PRs; avoid long-lived branches

