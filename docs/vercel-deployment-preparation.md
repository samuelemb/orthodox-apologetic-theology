# Vercel deployment preparation

Reviewed 2026-10-23. **Reuse decision: existing Supabase project `ctewndpjtkcpybclniuf` is now the production database target.** This supersedes the earlier recommendation to provision a separate production project. No deployment, account creation or hosted database/settings changes were performed. Application code and dependencies are unchanged.

## Build settings

For the later authorized import, select **Next.js** as Framework Preset and repository root as Root Directory. Use the existing `npm run build`; retain Vercel's framework-default output/install settings and the npm lockfile. No `vercel.json`, static export, custom server or catch-all rewrite is required. [Official build settings](https://vercel.com/docs/builds/configure-a-build).

Retain `.nvmrc` at Node **24**: local testing used 24.12.0, and Vercel supports Node 24 for builds and Functions. In **Project Settings → Build and Deployment → Node.js Version**, select **24.x**. Vercel documents project settings and `package.json` engines as its version controls; do not rely on `.nvmrc` alone. The existing `engines.node` range currently resolves to the supported 24.x major but is not a permanent major pin. Confirm the actual version in the first authorized build. Installed/locked Next.js is 16.4.0. [Runtime selection](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

## Environment variables — names and scopes only

Configure **Project Settings → Environment Variables**. Assign this project’s configuration only to Vercel Production. Preview/Development must use a separately authorized nonproduction project, or remain unconfigured/fail closed for database-dependent functionality. Do not repoint this production project to a test context or copy its server credentials into preview builds.

| Name | Execution use | Vercel environment scope |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Build/browser + server | Production for this project; separate nonproduction configuration for Preview/Development |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Build/browser + server | Production for this project; separate nonproduction configuration for Preview/Development |
| `SUPABASE_SECRET_KEY` **or** `SUPABASE_SERVICE_ROLE_KEY` | Server-only feedback insert; configure one | Production for this project; separate nonproduction credential for approved Preview/Development |
| `FEEDBACK_ALLOWED_ORIGINS` | Server-only origin validation | Production; separately reviewed nonproduction origins for Preview/Development |

Vercel scopes are deployment environments, not Netlify-style Builds/Functions permissions. Private keys must never have a public prefix or enter source/logs/client bundles. Changed settings apply to later deployments; public-prefixed settings are embedded during build. Do not upload `.env.local`, CLI credentials or `.tools/` test instrumentation. [Environment scopes](https://vercel.com/docs/environment-variables).

## Trusted origins and authentication

- Set the feedback allowlist to exact approved HTTPS origins, without trailing slashes. Include only canonical/served aliases deliberately. Do not allow wildcard Vercel domains or automatically trust generated preview URLs. Approved previews need their exact origins separately configured.
- The feedback limiter uses **no client-IP header**: its SQL-backed global allowance is 20 accepted messages per 10 minutes across instances. It remains global, not per-IP; preserve the honeypot and existing validation.
- In the intended Supabase project's **Authentication → URL Configuration**, set the canonical production Site URL and only required redirects. Keep public sign-ups, anonymous auth and unused providers disabled. No self-service password-recovery route exists; retain the documented trusted-admin recovery procedure.
- Preserve existing owner checks, host-bound session cookies, private/no-store admin responses, anonymous public teaching reads and uncached publication reads. On the first separately authorized preview, verify Server Actions, cookie refresh/sign-out, admin PATCH Origin/Host/protocol handling and cache headers behind Vercel. Do not loosen security checks preemptively.

## Read-only production readiness — 2026-10-23

| Check | Current result |
| --- | --- |
| Configured URL and CLI link | Both match `ctewndpjtkcpybclniuf` |
| Reviewed migration history | All six applied; zero pending or unexpected versions |
| Teaching versions | **1 draft; 0 published** (1 teaching total) |
| Feedback messages | **0** |
| Permanent owner | Exact locally recorded Auth UUID still exists and remains allowlisted; identity/UUID withheld |
| Public sign-ups | Disabled, confirmed through the current Auth settings response |
| Local server-only feedback credential | Present; value not printed or changed |
| Local feedback allowlist | No non-loopback HTTPS origin; production origin configuration remains outstanding |

Applied versions: `20261010000100`, `20261010000200`, `20261014000100`, `20261014000200`, `20261014000300`, `20261016000100`. No migration, seed or reset is required by this reuse decision. Counts, membership and history came from SELECT queries only; Auth configuration was read by GET. Initial read failures were followed by a successful connection diagnostic and bounded recheck; all confirmations above are current, not copied from old evidence. No record contents, owner identifiers or credential values were printed. The local detailed result is kept under ignored `.tools/production-reuse-readiness.json`.

## Production protection — mandatory for future work

**Future automated tests must not create, modify or delete any records in `ctewndpjtkcpybclniuf`, even temporary fixtures.** Do not run mutation-based smoke, integration, UI or security tests against it. This includes feedback submissions/status changes, teaching saves/publication, rate-budget changes and Auth/allowlist fixture provisioning or cleanup. Do not seed/reset it or change hosted settings as part of testing. Read-only checks must avoid exposing private content or personal information.

Historical hosted runners/provisioning helpers were written while this was development and several hardcode this project reference. They are **not production-safe** and must not be invoked against this target. Before any future mutation-based automated verification, separately authorize a disposable nonproduction project and review/retarget its tooling and credentials there. This guide adds an operational prohibition, not a runtime guard in those old scripts. The existing ignored local environment/CLI link now points at production: treat both accordingly. Preserve current content, feedback and permanent-owner membership. Ordinary owner business operations after authorization are distinct from automated tests.

## Vercel setup and remaining blockers

1. The local repository and initial commit already exist. Review the intended Git remote/source before importing. Do not upload private ignored files. Nothing was staged, committed or pushed in this readiness task.
2. Reuse this project’s configuration in the Vercel **Production** environment using the names/scopes above. No new production database or owner account is required by this check. Retain the existing permanent owner; confirm ownership/handover and secure recovery arrangements before launch. Any later account or hosted-settings change requires separate authorization.
3. In **Add New → Project**, select the reviewed repository, verify build/Node settings and configure environment scopes. **Stop before Deploy** until separately authorized; Git integration may trigger deployment on pushes. No Vercel dashboard/configuration values were changed here.
4. Choose the canonical hostname under **Project Settings → Domains**, confirm HTTPS, and deliberately set exact feedback origins. Separately review/update Supabase **Authentication → URL Configuration** for that hostname and only required redirects. Current production Site URL/redirect correctness was not verified through the public Auth settings endpoint. Sign-up disablement was verified. Do not loosen Origin or Server Action checks to work around an untested proxy.
5. There is no published content yet: public teaching pages will legitimately be empty. Obtain client approval and deliberately publish existing material only under a later authorized owner workflow. No existing draft was published or otherwise changed here.
6. Carry forward Phase 6 gates: deployed Vercel cookie/proxy/cache behavior, approved-video playback, physical-device/accessibility checks, copy approvals, owner handover/recovery and backup/restore rehearsal. Any deployed checks on this production project must remain read-only; run mutation journeys only against a separate nonproduction target. Preserve the documented global feedback allowance and uncertain-response duplicate limitation until a separately scoped decision addresses them.

**Readiness:** project identity, migration history, permanent-owner membership and disabled sign-ups pass the current read-only check. Production origins/Auth URL configuration, Vercel environment setup/deployment verification, published content and the remaining Phase 6 acceptance gates still block a launch-ready claim.

Prior Phase 6 build/TypeScript/lint and application journey results are reused as historical evidence. No application tests, account changes, database mutations, hosted settings changes, staging/commit/push or deployment were performed in this task.
