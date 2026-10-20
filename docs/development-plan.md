# Development plan

| Phase | Work | Status |
| --- | --- | --- |
| 1. Project foundation | Next.js setup, strict typing, public route group, four placeholders, branding, responsive shell, reusable styles, bilingual UI, documentation and checks | Implemented; validation details and tooling limitations in `validation.md`; Amharic copy awaits client review |
| 2. Public pages | Build approved homepage and other public content layouts, teaching list and `/teachings/[slug]` detail presentation | Public pages and Feedback preview implemented; Library polished; explicit translations grouped; sample behavior preserved during Phase 3A |
| 3. Database and security | Plan Supabase schema, teaching/content-language model, access policies, secure owner access | Phase 3A foundations and Phase 3B hosted development connection complete; 19 real-session checks/cleanup passed; local pgTAP unrun; permanent owner/admin/real data deferred |
| 4. Admin publishing | Owner teaching authoring, editing, publishing and management in a separate admin shell | Phase 4A authentication and Phase 4B teaching list/editor/private previews/per-language publication implemented; permanent owner retained; deletion and feedback inbox deferred; stop for review |
| 5. Public functionality | Search, filtering, live teaching retrieval and feedback workflow | Not started |
| 6. Testing and launch | Full flow/accessibility/security/responsive checks, client copy approval, deployment and launch review | Not started |

## Phase 1 delivered

- npm project and lockfile; compatible stable Next/React/Tailwind toolchain.
- `/`, `/teachings`, `/about`, `/feedback` with public header, footer, correct visible title and development placeholder.
- Original supplied logo, warm light theme, serif headings, red actions, gold accents, shared control styles.
- Mobile disclosure menu, desktop navigation and active-page state.
- English/Amharic dictionaries and device-local preference with hydration-safe application.
- Accessible landmarks, skip link, visible focus and touch targets.
- Independent article-width token and documented future teaching detail/admin route locations.
- Build, type, lint, and browser validation record.

## Before proceeding

Review the public pages and draft English/Amharic copy with the client. Track the development linter advisory and ESLint support limitation recorded in README. The latest request groups only explicitly linked local teaching translations. Stop for review; see `phase-2-teaching-translations.md` (6 unique teachings, 12 versions). Phase 3A repository foundations are now implemented; see `phase-3-database-security.md`. Phase 3B hosted verification is complete; 19 real-session checks and cleanup passed. Stop for review before permanent owner provisioning/admin development. Local pgTAP remains unrun. Feedback remains a local-validation preview; admin UI, real reads/submission and deployment remain deferred.

## Phase 2 Home preview

Hero, original logo, search, purpose link, four topic tiles, three sample teaching cards, and ministry callout are implemented in reusable Home components. Home has passed visual review. Search, topic browsing and View all now connect to the sample library; Read teaching now opens local sample articles. See `phase-2-library.md` for current behavior and verification; `phase-2-home.md` records the earlier visual-preview stage.

## Outside initial scope

Comments, audio uploads, public registration, and migration of Telegram content.

