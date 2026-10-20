# Phase 3A / 3B — Database and security foundations

Phase 3A repository foundations were implemented on 2026-10-10. Phase 3B hosted development verification completed on 2026-10-13: both migrations applied, public sign-ups disabled, 19 real-session checks passed and all temporary resources cleaned up. The original local pgTAP command remains unrun; see the final Phase 3B record below. Public pages still use **six sample teachings and twelve language versions**. No client sample seed, permanent owner, admin screens, real public data reads, feedback submission or deployment was added.

## Schema and version publication

Apply the versioned migrations in order:

1. `supabase/migrations/20261010000100_content_validation.sql`: JSON article validation and feedback validation helpers.
2. `supabase/migrations/20261010000200_schema_and_rls.sql`: tables, constraints, indexes, timestamps, privileges, owner authorization and RLS.

| Table | Purpose and constraints |
| --- | --- |
| `public.topics` | Canonical filter IDs `repentance`, `sacraments`, `fathers`, `apologetics`, with English/Amharic labels. These four reference rows are installed by the migration. |
| `public.teachings` | Stable text ID, topic FK, creation/update timestamps. Existing six sample teaching identities fit unchanged. |
| `public.teaching_translations` | Teaching FK; one row per `(teaching_id, language)`; en/am only; globally unique existing-format slug; title, excerpt, JSON article; optional validated 11-character YouTube ID; draft/published status; publication time and timestamps. Deleting a teaching cascades its translations. |
| `public.feedback` | UUID, optional name/email, nonempty message, unread/read status and creation time. Name <=100 and message <=5,000 UTF-16 units, matching the existing form including emoji. JavaScript trim whitespace is rejected for an empty message. Provided email receives the same basic whitespace/at-sign/dot format validation; future endpoint must normalize empty optional fields to NULL and revalidate. |
| `private.owner_allowlist` | Auth UUID FK and provisioning timestamp. Not exposed in Data API schemas; no application role can read or change it. Auth-user deletion removes membership. |

Topics have restrictive references. Teaching/topic, publication/language and feedback status/creation indexes support expected listing and management queries. Primary keys, unique slugs and unique teaching/language pairs provide their own indexes. Teaching and translation triggers maintain update time, preserve creation time and reject primary-ID changes on updates.

**Publication belongs to the translation.** English may be published while Amharic stays draft. `published` requires a publication timestamp; `draft` requires NULL. Publish/unpublish writes must change both fields atomically. Status defines visibility immediately; future scheduling is not implemented. A teaching with no published translation is hidden from public readers. Stable grouping does not imply publication or automatic translation.

## Article-content contract

Use a versioned JSONB document, not HTML, Markdown or executable MDX:

```json
{
  "version": 1,
  "sections": [
    { "id": "introduction", "heading": "Introduction", "paragraphs": ["Plain text."] },
    { "id": "watch-the-teaching", "heading": "Watch the teaching", "video": { "title": "Teaching video" } }
  ]
}
```

`valid_article_content` enforces version 1, strict allowed keys, 1–100 sections, unique lowercase section anchors, nonempty headings <=300 characters, optional 1–200 plain-text paragraphs per section (each <=10,000 characters), and at most one video placeholder with a title <=300. Each section needs paragraphs or a video. `src/lib/article-content.ts` validates the same document shape in application code. Unknown HTML/MDX fields, nested paragraph objects, malformed arrays and duplicate anchors are rejected. A future document format must use a new version and migration.

This matches the existing renderer's `sections` model. Future adapters map `excerpt` to the existing `description`, use `article_content.sections`, and inject `youtube_video_id` into the video section's `video.id`. Current samples retain their video placeholder titles with no invented playback ID. Render strings as React text nodes (which escape markup); never use `dangerouslySetInnerHTML` or evaluate text. The ID permits only the existing YouTube embed path; arbitrary URLs/HTML cannot enter that field. A future editor can manage these typed section/paragraph blocks without changing the content language.

## Access rules

Every application table and the allowlist has RLS enabled. Explicit grants replace default table privileges. Application roles cannot create objects in the public schema. No owner authorization depends on user/app metadata.

| Caller | Read | Write |
| --- | --- | --- |
| Anonymous | Topics; published translations; teaching metadata only if at least one translation is published | None, including direct feedback insertion |
| Authenticated non-owner | Same public content; feedback queries return no rows | RLS denies inserts and exposes no rows for updates/deletes; no allowlist access |
| Authorized owner | All teaching/translations, including drafts; feedback | Teaching/translation/feedback create, update and delete. No allowlist administration. Topics remain reference data. |
| Trusted database administrator | Administrative provisioning | Manual allowlist maintenance only through trusted SQL/admin tooling |

`public.is_owner()` is a boolean, no-argument, SECURITY DEFINER function owned by postgres with an empty search path and qualified references. It only tests the authenticated `auth.uid()` against the protected allowlist. Execute is granted to authenticated callers, not anonymous visitors. The function cannot accept a target user ID, enumerate members or modify membership. RLS calls this same check; removal takes effect on the next request without trusting stale role claims.

The reserved service role has only an explicit feedback INSERT grant on these application tables after default grants are revoked. It bypasses RLS and is not used by application code in this phase. Do not give its key to visitors or use it for normal public reads. Table owners/trusted administrators can bypass RLS; production administrator credentials require separate protection.

## Application helpers and environment

Official libraries: `@supabase/supabase-js` and `@supabase/ssr`; Next.js 16.4 async cookies and `proxy.ts` conventions are used. `server-only` prevents server helpers being imported into a browser module.

- `src/lib/supabase/config.ts`: lazy validation of URL and modern `sb_publishable_` key; missing config, secret keys and unsafe URLs throw generic errors without logging values.
- `browser.ts`: cookie-based browser client; currently unused by the public UI.
- `server.ts`: a new request-scoped, publishable-key client with the user's cookies/JWT.
- `owner.ts`: `requireOwner()` verifies the identity using `auth.getUser()` and independently checks the protected `is_owner()` RPC. Invalid/missing users, nonowners, RPC errors or missing configuration never authorize. No `getSession()` trust or metadata roles.
- `proxy.ts` helper plus `src/proxy.ts`: refresh sessions with verified claims only on future `/admin/*` and `/auth/*` paths. Refreshed cookies/cache headers are forwarded. This is session plumbing, not an authorization gate; every future server action/handler must call `requireOwner()` and keep RLS. No admin/login route or screen exists yet. Missing config returns 503 on these reserved paths. Public sample routes do not invoke Supabase.
- `database.types.ts`: initial typed schema contract. Regenerate from the verified local schema before wiring real queries.

Copy `.env.example` to ignored `.env.local` when intentionally configuring a project:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Both can remain blank for the current sample application. No credential is evaluated during module import. Privileged keys (`SUPABASE_SECRET_KEY`, legacy `SUPABASE_SERVICE_ROLE_KEY`) are commented, optional future placeholders and are not consumed now. They must stay server-only, never have a `NEXT_PUBLIC_` prefix, and never enter logs or client bundles. Do not paste database passwords/CLI access tokens into documentation. `.env*`, Supabase temporary state and linked project references are ignored. This workspace currently has no Git repository; these ignore rules apply when Git is initialized.

Authenticated responses must not be statically/CDN cached. The session proxy returns private/no-store responses. Future owner Route Handlers/Server Actions must also return appropriate cache headers and must not wrap identity/membership checks in shared caches. Server Components cannot save refreshed cookies; the proxy handles refresh on auth routes. Callback/handler responses must preserve cookie/cache headers when added later.

## Local setup and development seed

Prerequisites: supported Node, Docker Desktop with Linux containers running, the Supabase CLI and (for explicit seed loading) `psql`. No local service is started automatically.

```powershell
npm install
npm run db:start
npm run db:reset:local
npm run db:test
npm run test:foundation
```

`db:reset:local` is destructive to the **local** database only; it applies migrations with `--local --no-seed`. The CLI configuration disables automatic seeds and public signup. Keep `private` out of exposed Data API schemas. `db:test` runs the pgTAP files against local Supabase; it must not target a linked hosted project.

`supabase/tests/database/authorization.test.sql` creates separate security fixtures in a transaction and rolls them back. Assertions use `SET LOCAL ROLE anon/authenticated` and transaction-local JWT claims. Privileged SQL is used only to arrange fixtures/provision test membership, not for access assertions. Tests cover published English/draft Amharic, draft-only teaching, public/nonowner writes, feedback privacy, owner CRUD, metadata spoofing, self-promotion denial, revocation and constraints.

Generate/review development content without touching any database:

```powershell
npm run db:seed:generate
```

`supabase/seeds/development.sql` contains exactly the current six stable teachings and twelve versions, preserving titles, excerpts, sections, slugs and relationships. All versions are **draft**, pending client review. No security fixtures, owners or feedback are included. It does not overwrite existing translation rows on rerun. The SQL requires an explicit session opt-in, and is not listed in automatic CLI seeds.

To apply it only to an intentionally disposable local database, supply the local password through a protected environment/pgpass mechanism and run:

```powershell
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -v ON_ERROR_STOP=1 -c "SET app.allow_development_seed = 'true'" -f supabase/seeds/development.sql
```

Check the host and port before running. Never run this content seed on a hosted project. Its SQL opt-in is an accident-prevention guard, not a security boundary. To review public publication locally, publish chosen versions explicitly as the local administrator/owner; drafts must remain hidden to anon.

## Hosted setup and first owner — later manual steps

These are instructions only; none have been performed.

1. Finish local migration/RLS verification first. Create a separate Supabase project deliberately, choose its region, and record its project reference securely.
2. In Auth settings disable **Allow new users to sign up**, anonymous sign-ins and any unused providers. Restrict Site URL/redirect allowlist to the intended application URLs. The local CLI config does not automatically configure hosted Auth settings.
3. Review migration SQL and CLI target. Log in using official tooling, run `npx supabase link --project-ref YOUR_PROJECT_REF`, inspect `npx supabase db push --dry-run`, then deliberately apply only the two migrations with `npx supabase db push`. Do not use `--include-seed`. Do not apply test fixtures or the development content seed.
4. A trusted project administrator creates/invites the intended owner through Supabase Auth user management (sign-up remains disabled). Verify the person's exact Auth user UUID. Do not insert password records manually or copy editable metadata roles.
5. The trusted administrator uses the SQL editor/administrative connection to add only that verified UUID:

```sql
insert into private.owner_allowlist(user_id)
values ('REPLACE_WITH_VERIFIED_AUTH_USER_UUID'::uuid)
on conflict (user_id) do nothing;
```

The FK requires an existing Auth account. The application owner cannot execute this through the public Data API. Revoke with `delete from private.owner_allowlist where user_id = 'VERIFIED_UUID'::uuid`; never temporarily grant allowlist access to authenticated users.

6. Verify anonymous/nonowner/owner behavior on a separate staging project before launch. Add its URL and **publishable** key to `.env.local`/server environment. No privileged key is needed for the current foundation. Regenerate schema types (`npx supabase gen types typescript --local` after local verification, or `--linked` against the reviewed target).
7. Run build/type/lint checks again. Public pages will still use local samples; real data retrieval and admin/auth UI require a subsequent scoped phase. No deployment is part of Phase 3A.

## Future feedback endpoint

The preview form remains local validation only. A later server endpoint must validate the same optional name/email and required message limits, normalize empty optional fields to NULL, reject whitespace-only input, validate JSON/content type and cap request bytes. Never trust browser validation alone. Apply server-controlled unread status; ignore client IDs/status/timestamps. Keep any privileged insertion key inside a server-only module.

Before enabling submission, add request rate limits, origin/CSRF controls appropriate to the endpoint, bot protection/honeypot or CAPTCHA as needed, abuse monitoring without logging messages/emails, and a retention/privacy policy. Decide failure handling and duplicate/idempotency behavior. Do not promise reply times or delivery. No endpoint, email delivery, storage of form values or networking was added now.

## Phase 3A verification record (historical)

- Application foundation tests: passed (runtime article validator, exact six/twelve seed identity checks, config rejection, mocked verified-identity/allowlist success and fail-closed cases). Mocked application checks do not validate database policies or real Supabase Auth sessions.
- Build, TypeScript and lint: passed without Supabase credentials. The 24-case Library matrix and 24 existing article checks passed with unchanged sample data and no JavaScript page errors.
- Database migrations/RLS/pgTAP: **UNVERIFIED**. Docker Desktop, PostgreSQL/psql and a running local Supabase stack were unavailable on this machine. `npm run db:test` was attempted and exited before running any SQL: `supabase` was not recognized. The CLI installation attempt did not complete with a usable Windows binary; it is not added as a dependency. Install the official CLI separately (including its platform binary) before using the scripts. Authored SQL tests must not be reported as passed. Run both migrations and the actual role/session tests locally before connecting a hosted project.
- No hosted project, database, credentials or deployment was used. Public sample behavior and approved fonts/colors/layouts are preserved, except the requested filter label is now **Teaching language / የትምህርቱ ቋንቋ**.
- npm audit reports five high-severity entries in the existing development lint dependency chain (braces/micromatch/fast-glob/Next ESLint). No forced downgrade or unrelated dependency migration was applied. Audit the toolchain separately; the runtime Supabase dependencies have no advisories in this report.

Official references consulted: [Supabase SSR clients and identity verification](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs), [API keys and privileged-key handling](https://supabase.com/docs/guides/getting-started/api-keys), [pgTAP/database testing](https://supabase.com/docs/guides/database/testing), [local CLI setup](https://supabase.com/docs/guides/local-development/cli/getting-started). Also checked the installed Next.js 16.4 documentation for asynchronous cookies and `proxy.ts` conventions.


## Phase 3B — Hosted development verification (2026-10-13)

Target explicitly supplied by the client: `ctewndpjtkcpybclniuf`, URL `https://ctewndpjtkcpybclniuf.supabase.co`. Authenticated CLI account metadata verified the project as active and healthy. No local Docker stack is used in this workflow.

The official portable Windows CLI 2.120.0 was downloaded from the Supabase GitHub release and checked against its published SHA-256 checksum. Binaries and local credentials are under ignored `.tools/`. Browser CLI authentication completed. The CLI linked the exact target; every hosted helper checks that reference before any SQL operation. Read-only Management API queries confirmed no application schema/functions, migration history, Auth users or Storage data before changes. Evidence: `docs/verification/phase-3b-before-migrations.json`.

`db push --linked --dry-run --skip-vault` previewed exactly `20261010000100` and `20261010000200`, with no seeds or custom roles. Both migrations were applied through `db push --linked --skip-vault`; history was preserved, with no reset, repair or client sample seed. Post-migration inspection found the two recorded versions, expected schema only, four canonical topic rows and empty teaching/translation/feedback/owner tables. Evidence: `docs/verification/phase-3b-preflight.json`.

The newer CLI performs hosted SQL queries through the authenticated Management API without Docker. API keys were captured directly into ignored `.env.local` without printing their values. The existing names are `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and temporarily `SUPABASE_SECRET_KEY` (legacy `SUPABASE_SERVICE_ROLE_KEY` is also supported). No key values, access tokens, database passwords or signed-in test JWTs are written to reports. A CLI-only database password, if supplied through the optional masked setup script, is Windows-user-encrypted under `.tools/`; it is passed to child CLI processes in memory, never command arguments. Do not commit this folder or environment files. No login/invitation email is sent by the test runner.

Manual connection fallback: `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-phase-3b.ps1`; `-SkipLogin` resumes after browser login, and `-TokenLogin` accepts an account token at a masked prompt if browser login is unavailable. The preferred current CLI workflow does not require re-entering a database password. Never paste credentials into chat or use command-line token/password literals.

Disable “Allow new users to sign up” in Dashboard Authentication → Sign In / Providers (or General configuration) and leave anonymous sign-ins disabled. The runner independently reads `/auth/v1/settings` using the publishable key and refuses to create accounts unless public signup is disabled. Permanent owner provisioning remains a separate trusted manual step; no permanent account or allowlist entry is created by this run.

`npm run db:test:hosted` uses the ordinary publishable key for anonymous clients and real password-signed-in user sessions. Only Auth-admin `createUser(email_confirm:true)`/account cleanup and fixture SQL use privileged access. Test accounts have random passwords, unique reserved test emails, a run marker in metadata and no invitation/confirmation mail. Fixture content is independent from the client samples. The checks cover published/draft direct ID/slug access, hidden draft-only teaching, anonymous and non-owner writes/feedback privacy, metadata spoofing, private allowlist denial, owner CRUD, per-language publication, constraints and membership revocation.

A local ignored run manifest records only run IDs, anticipated fixture IDs and temporary account IDs/emails—not passwords or JWTs. Cleanup deletes exact fixture IDs, removes temporary memberships and deletes only accounts carrying that run marker. Cleanup verifies zero remaining fixtures/accounts; any failure is recorded separately. Do not delete all users or tables to clean up.

**Final Phase 3B verification status (2026-10-13): completed.** Both migrations applied and history verified, with no reset, repair, seeds or pending migrations. The post-cleanup inspection contains four canonical topics and zero teachings, translations, feedback, allowlist members, Auth users or Storage data. Initial state, migration evidence and final state are recorded in `docs/verification/phase-3b-before-migrations.json`, `phase-3b-migrations.json` and `phase-3b-preflight.json`.

The first hosted-run attempt stopped before creating resources because the live API still reported sign-ups enabled. A read-only configuration diff confirmed the hosted setting remained true. A separate ignored minimal configuration declared only `auth.enable_signup = false`; its reviewed diff showed exactly that one property, and the CLI applied only that property. No other Auth/API/database/Storage settings or secrets were changed. The subsequent live API check confirmed public sign-ups disabled; anonymous sign-ins remained disabled. Evidence: `phase-3b-auth-config-preview.json`.

**19 hosted checks passed** using real signed-in sessions and ordinary publishable-key clients. Coverage includes anonymous published-only reads, direct ID/slug draft denial, hidden draft-only metadata, denied anonymous/non-owner writes, feedback privacy, editable-metadata spoofing, private allowlist denial, owner draft/content/feedback CRUD, independent reversible translation publication, content/feedback constraints and immediate owner revocation. Privileged access was limited to fixture/membership SQL and Auth-admin account setup/cleanup. No permanent owner was provisioned and no invitation/confirmation emails were sent. No database-policy defects were found, so no additional SQL migration was needed.

All cleanup checks passed: exact fixture rows and memberships removed, both run-tagged temporary Auth accounts deleted, and zero remaining run resources independently verified. Cleanup did not target unrelated rows/accounts. Exact names/outcomes and cleanup results are in `docs/verification/phase-3b-hosted-authorization.json`. The temporary privileged-key entry was removed from `.env.local` after successful cleanup; only the public URL/publishable-key connection values remain. To rerun, provide a privileged Auth-admin key locally again, never through chat or logged command arguments.

Build, TypeScript, lint, application foundation tests, the 24-case Library/24-article suite and eight Feedback browser cases passed. The production Feedback test initially flagged normal Next.js navigation prefetch; the test now permits only known same-origin body-free framework GETs while still rejecting submissions, external/API requests and form persistence. No public UI behavior was changed.

Original local `db:test` remains **unrun** because the Docker stack is unavailable. Hosted checks are a separate real-session suite, not a pgTAP pass. The original SQL pgTAP file still includes additional assertions not all covered by the hosted suite (for example, every individual schema constraint); those assertions must not be described as executed. Network/browser coverage used desktop Chrome viewport emulation, not physical devices or other engines. The Phase 3A instruction to verify locally first is superseded for this explicitly authorized hosted development workflow; production deployment still requires its own review.

Public pages remain on the same six local sample teachings/twelve versions. Feedback remains validation-only preview. No admin screens, database-backed public content, real submission or deployment are part of Phase 3B.
