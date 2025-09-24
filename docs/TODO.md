# TODO / Roadmap

Simple, living checklist for coordination. Update as you go; keep items small and shippable. Use [ ] / [x].

## Now
- [x] Add Discover view with insights and recommendations
- [x] Capture structured rejection reason on: drag to Rejected, bulk actions, and modal save
- [x] Optional: make rejection reason mandatory on any transition to Rejected (toggle in settings)
- [x] Add quick dropdown toast for rejection reason (no prompt) near the Rejected column

## Next
- [x] Analytics: charts for rejection reasons (by segment, by company)
- [x] Discover: diversify by creator/company/segment (MMR/xQuAD-lite)
- [x] Discover: expand catalog and allow editing via JSON file
- [x] Import: support CSV with columns for reason, vibe, fit, status (map to fields)
- [x] UI polish for Discover list (sorting, filters, pagination)

## Later
- [ ] Settings: weights for status/vibe/fit and exploration budget
- [ ] Settings: toggle “reason required for rejection”
- [ ] Integrations: external sources (LinkedIn/company boards) for auto-import
- [ ] Privacy & provenance: local-only by default, explicit consent for any remote calls
- [ ] Evaluation: simple dashboards for offer rate, loss rate by reason/segment
- [ ] Telemetry: event logging abstraction (still local) to support future analysis

## Acceptance Criteria (examples)
- Discover shows top 3–4 segments with average scores and updates as activities change
- Rejection reasons appear in Discover and Activity Timeline
- One-click “Add” on Discover imports a role and persists via localStorage
- Preview deploy URL is auto-commented on PR and opens successfully

## Owners
- Product/UX: Zach
- Engineering: AI assistant (implementation), Zach (review/merge)

## Notes
- Keep PRs small (1–3 logical changes). Each PR should build and preview.
- If a task might be risky, add it under Next/Later and confirm before implementing.
