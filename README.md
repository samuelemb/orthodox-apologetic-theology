# Orthodox Apologetic Theology

Current delivery: Phase 4B adds a real owner teaching list, bilingual section editor, private previews and independent per-language publication. Saves are atomic, retry-safe and detect conflicting edits through invoker RPCs with existing RLS. The permanent owner is retained. Public pages still use six sample teachings/twelve versions, and Feedback remains preview-only. Teaching deletion, feedback inbox operations, live public content/submission and deployment are deferred. See [teaching editor handoff](docs/phase-4-teaching-editor.md) for setup, exact checks and credential-free screenshots, and [owner authentication](docs/phase-4-admin-auth.md) for provisioning. Original local `db:test` remains unrun (Docker unavailable).

Previous Phase 2 delivery: explicitly linked local translations are grouped into 6 unique teachings with 12 language versions. Library, Home and related entries use shared teaching identities; all detail URLs remain available. See [translation model](docs/phase-2-teaching-translations.md) for behavior, screenshots and verification. The [polished Library layout](docs/phase-2-library-polish.md), current fonts and shared public pages remain. [Feedback](docs/phase-2-feedback.md) is a local-validation preview. Stop for review before Phase 3. The older sections below retain their original implementation context. Database, admin, real feedback delivery and deployment remain deferred.

Phase 1 public website foundation plus the Phase 2 Home visual preview. The existing `AI images/` reference files are preserved. The interface uses the original logo, semantic HTML, and responsive CSS; the reference screenshots are not rendered as the website.

## Run locally

Use Node.js 24 LTS (tested with 24.12.0) and npm (tested with 11.9.0).

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. No environment variables or external accounts are required. Next's font integration downloads Google font files during the first build and serves them locally afterward; that first build needs network access.

```sh
npm run lint
npm run typecheck
npm run build
npm run start
```

`start` serves the production build; stop the development server first if it uses the same port. Both commands bind to loopback only. `typecheck` generates Next route types before running strict TypeScript checks.

## Versions and installation

Initialized manually following the official [Next.js installation instructions](https://nextjs.org/docs/app/getting-started/installation) and [Tailwind Next.js guide](https://tailwindcss.com/docs/installation/framework-guides/nextjs). npm was selected because the folder contained no existing application or lockfile. Keep `package-lock.json` and use `npm ci` for repeatable installs.

| Package | Installed version |
| --- | --- |
| Next.js / eslint-config-next | 16.4.0 |
| React / React DOM | 19.3.0 |
| Tailwind CSS / @tailwindcss/postcss | 4.3.3 |
| TypeScript | 6.0.3 |
| ESLint | 9.39.5 |
| @types/node | 24.19.1 |
| @types/react / @types/react-dom | 19.3.0 |

Next, React, and Tailwind use the stable registry releases available at setup. TypeScript 6.0.3 is used because the current Next ESLint toolchain requires TypeScript below 6.1; the registry's TypeScript 7 is incompatible. ESLint 9.39.5 is used because Next's React, import, and accessibility plugins do not declare ESLint 10 compatibility. npm flags ESLint 9 as out of support; revisit when the upstream plugin chain supports ESLint 10.

## Structure

```text
src/app/layout.tsx              Root fonts, metadata, language provider
src/app/(public)/layout.tsx     Public header, main landmark, footer
src/app/(public)/page.tsx       /
src/app/(public)/teachings/     /teachings
src/app/(public)/about/         /about
src/app/(public)/feedback/      /feedback
src/components/                Shared shell, container, placeholder
src/styles/theme.css           Tokens, responsive rules, shared controls
src/i18n/en.ts                 English interface dictionary
src/i18n/am.ts                 Draft Amharic interface dictionary
src/i18n/language-provider.tsx  Device-local preference and document lang
src/lib/site.ts                Navigation, route helper, logo and Telegram URL
public/images/logo.jpg         Unmodified original supplied logo
docs/                         Brief, six-phase plan, validation record
```

The `(public)` route group adds no URL segment. `src/app/admin/layout.tsx` provides the separate admin shell; the `(protected)` group and individual pages verify owner access on the server. Admin sign-in requires the reviewed Supabase configuration; public sample pages remain usable without it.

`/teachings/[slug]` now renders the shared local sample articles. Unknown slugs return 404 with a library link. Article language remains independent of interface preference.

## Design and accessibility

`src/styles/theme.css` centralizes warm white, ink, muted text, deep red, gold, borders, spacing, radius, and touch-target values. It also maps tokens to Tailwind. Gutters are 16px on mobile, 24px on tablet, and 32px on desktop, with no narrow maximum width on the public shell. `--reading-width` independently controls article measure. English uses Chakra Petch, with bold headings and regular paragraphs; Amharic uses the supplied Bela Bereka Bold. Fonts are served by Next after build, and language styles follow the content language.

Reuse `.button.button-primary`, `.button.button-secondary`, `.text-link`, `.form-label`, and `.form-field`. Every field must have a visible associated label; error text must be linked with `aria-describedby`. Library search uses local sample records. Feedback validates locally with accessible inline errors and a preview status; real submission is not implemented.

Navigation includes active-page indicators, 44px minimum control heights, visible focus, a working skip link, and a disclosure menu with `aria-expanded`, `aria-controls`, Escape dismissal and focus return. Mobile navigation closes on link selection and when entering the desktop breakpoint. Logo alt text is empty because the adjacent brand text gives the same link its accessible name.

## Language behavior

The preference is stored only in this browser under `oat-interface-language`. SSR and first hydration both use English; `useSyncExternalStore` then applies the saved preference and updates `<html lang>`. A returning Amharic reader can briefly see English before hydration. Storage failures fall back to in-memory switching for the session. Storage events synchronize other tabs. There is no account, cookie, database, or automatic article translation.

Amharic wording, including the translated site name, is **draft for client review**. Browser-tab metadata remains English in this phase; visible navigation, headings, placeholder copy, language labels, skip link, and footer switch together.

## Scope and validation

Phase 1 and the Phase 2 Home visual preview are implemented. See [project brief](docs/project-brief.md), [development plan](docs/development-plan.md), [Phase 1 validation](docs/validation.md), and [Home preview notes](docs/phase-2-home.md). Search functionality, teaching destinations, other public page content, feedback submission, Supabase, authentication, admin publishing, and deployment are deferred. Home sample data is in `src/data/sample-teachings.ts`, reusable cards are in `src/components/home/`, and all preview copy is in the existing dictionaries.

The production dependency audit reports zero vulnerabilities. The full audit reports five high-severity development-tool findings in the `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces` chain (one underlying braces advisory, propagated through its dependents). The installed latest compatible chain has no safe current fix offered by npm; its suggested force fix downgrades Next's lint configuration to version 14. Do not apply `npm audit fix --force` without reviewing compatibility. Track [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) and update the tooling when an upstream fix is available.

