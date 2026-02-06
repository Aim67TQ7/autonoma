# Rob's List — Access & Resources Needed

## Pending
| # | Category | What's Needed | Why | Blocking? | Date Added |
|---|----------|---------------|-----|-----------|------------|
| 1 | Credential | Supabase project URL + anon key + service key for Autonoma | Database layer is fully coded but can't connect without credentials. All CRUD operations, project creation, and task management depend on this. | All features requiring persistence | 2026-02-05 |
| 2 | Credential | Anthropic API key for Autonoma deployment | AI-powered project intake, charter generation, and health scoring require Claude API access. Currently coded against claude-sonnet-4-20250514. | AI features (intake, charter gen, escalation) | 2026-02-05 |
| 3 | Decision | Authentication strategy — Supabase Auth, Clerk, or NextAuth? | Current deployment is public (no auth). Need a decision before building user accounts, RBAC, and multi-tenant isolation. | Phase 2 (user onboarding) | 2026-02-05 |
| 4 | Decision | Pricing tiers for Autonoma subscriptions | Can't build pricing page or billing integration without knowing the model. Suggested: Free (1 project), Pro ($49/mo, 10 projects), Enterprise (custom). | Phase 3 (revenue) | 2026-02-05 |
| 5 | Decision | Custom domain for Autonoma | Currently at autonoma-ai.netlify.app. Need a production domain (e.g., autonoma.ai, getautonoma.com) for professional positioning. | Not blocking, but needed for launch | 2026-02-05 |

## Completed
| # | What Was Needed | Resolved | Date |
|---|----------------|----------|------|
