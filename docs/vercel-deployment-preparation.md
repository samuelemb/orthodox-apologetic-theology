# Vercel deployment preparation

Reviewed 2026-10-19. **No deployment, account creation or hosted database changes.** This replaces the Netlify guide. Application code and dependencies are unchanged.

## Build settings

For the later authorized import, select **Next.js** as Framework Preset and repository root as Root Directory. Use the existing `npm run build`; retain Vercel's framework-default output/install settings and the npm lockfile. No `vercel.json`, static export, custom server or catch-all rewrite is required. [Official build settings](https://vercel.com/docs/builds/configure-a-build).

Retain `.nvmrc` at Node **24**: local testing used 24.12.0, and Vercel supports Node 24 for builds and Functions. In **Project Settings → Build and Deployment → Node.js Version**, select **24.x**. Vercel documents project settings and `package.json` engines as its version controls; do not rely on `.nvmrc` alone. The existing `engines.node` range currently resolves to the supported 24.x major but is not a permanent major pin. Confirm the actual version in the first authorized build. Installed/locked Next.js is 16.4.0. [Runtime selection](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

## Environment variables — names and scopes only

Configure **Project Settings → Environment Variables**. Assign production configuration only to Production; configure separate development-project settings for Preview/Development. Never copy production credentials into untrusted preview builds.

| Name | Execution use | Vercel environment scope |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Build/browser + server | Production; separately configured Preview/Development |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Build/browser + server | Production; separately configured Preview/Development |
| `SUPABASE_SECRET_KEY` **or** `SUPABASE_SERVICE_ROLE_KEY` | Server-only feedback insert; configure one | Production; separate development credential only for approved Preview/Development |
| `FEEDBACK_ALLOWED_ORIGINS` | Server-only origin validation | Production; separately reviewed Preview/Development origins |

Vercel scopes are deployment environments, not Netlify-style Builds/Functions permissions. Private keys must never have a public prefix or enter source/logs/client bundles. Changed settings apply to later deployments; public-prefixed settings are embedded during build. Do not upload `.env.local`, CLI credentials or `.tools/` test instrumentation. [Environment scopes](https://vercel.com/docs/environment-variables).

## Trusted origins and authentication

- Set the feedback allowlist to exact approved HTTPS origins, without trailing slashes. Include only canonical/served aliases deliberately. Do not allow wildcard Vercel domains or automatically trust generated preview URLs. Approved previews need their exact origins separately configured.
- The feedback limiter uses **no client-IP header**: its SQL-backed global allowance is 20 accepted messages per 10 minutes across instances. It remains global, not per-IP; preserve the honeypot and existing validation.
- In the intended Supabase project's **Authentication → URL Configuration**, set the canonical production Site URL and only required redirects. Keep public sign-ups, anonymous auth and unused providers disabled. No self-service password-recovery route exists; retain the documented trusted-admin recovery procedure.
- Preserve existing owner checks, host-bound session cookies, private/no-store admin responses, anonymous public teaching reads and uncached publication reads. On the first separately authorized preview, verify Server Actions, cookie refresh/sign-out, admin PATCH Origin/Host/protocol handling and cache headers behind Vercel. Do not loosen security checks preemptively.

## Production setup and remaining steps

1. Later prepare a reviewed Git repository/remote; none currently exists here. Keep existing ignore rules and private files excluded. No repository or account was created in this task.
2. Keep the current Supabase project for development. Phase 6 found one unpublished teaching, no published versions/feedback, and a permanent development owner. No fresh database query was needed. With separate authorization, select/provision production, apply the six reviewed migrations without seeds, and provision the verified client owner privately. Preserve development content/accounts.
3. In Vercel's **Add New → Project** import flow, choose the reviewed repository, verify the build/Node settings, and configure environment scopes before an authorized first build. **Stop before Deploy**; Git integration can also trigger deployments on pushes.
4. Configure the canonical hostname under **Project Settings → Domains**, confirm HTTPS, and align feedback/Auth origins. Review Preview settings before sharing any generated URL.
5. Complete the Phase 6 gates: approved content/copy and video playback, owner handover/recovery, backup/restore rehearsal, and deployed/physical-device checks. Local journey evidence is not a Vercel deployment pass.

Only configuration checks were run: removal of the two Netlify files and its single ignore entry, retained Node-major compatibility, and presence of the existing build script/lockfile. Prior build/TypeScript/lint results are reused. No application suites, deployment commands or database operations were run.
