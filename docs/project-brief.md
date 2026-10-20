# Project brief

Current authorized increment (2026-10-14): Phase 4B real teaching management, bilingual section editor, owner-only preview and per-version publication. This supersedes historical scope below. Public sample pages and Feedback preview remain unchanged; stop before deletion, inbox operations, Phase 5 real public content/submission or deployment. See `phase-4-teaching-editor.md`.

Current authorized increment (2026-10-13): Phase 4A owner authentication and protected admin layout, including private permanent development-owner provisioning. This supersedes the historical scope below. Stop before the teaching editor, feedback inbox operations, real public content/submission or deployment. See `phase-4-admin-auth.md`.

Current authorized scope (2026-10-10): Feedback is implemented as a local-validation preview using the supplied desktop/mobile designs and current Chakra Petch/Bela Bereka typography. Stop for Feedback visual review; see `phase-2-feedback.md`. This supersedes the older page-stopping instructions below. Backend, authentication, admin, delivery and deployment remain deferred.

## Purpose

Orthodox Apologetic Theology organizes Orthodox teachings so visitors can find material on repentance, the sacraments, the Church Fathers, and apologetics. The existing ministry channel is https://t.me/orthodox_chrstianity. The owner will publish teachings through an admin area in a later phase.

## Approved references

- Original logo: `AI images/loggo.jpg`; copied unchanged to `public/images/logo.jpg`.
- Desktop: `AI images/website/Clean desktop website with gold logos.png`.
- Mobile: `AI images/mobile/Orthodox teaching library homepage-5.png`.

Follow the approved designs rather than inventing a new visual direction. Phase 1 adopts their branding, typography, shell, language control, and restrained styling. Their search, topic tiles, teaching cards, and ministry callout belong to Phase 2; they are deliberately absent from these lightweight placeholders. The real Telegram link is included in the shared footer in this phase.

## Visual and responsive requirements

Warm white background; dark serif headings; readable sans-serif body text at about 16px or larger; deep red links and primary buttons; gold accents; thin light borders; restrained rounding. Noto fonts cover English and Ethiopic. Centralize design values. Use approximately 16px mobile and 24–32px desktop gutters, avoiding wide empty outer margins. Keep article reading width independent. Ensure comfortable touch targets and prevent horizontal overflow.

The desktop header shows logo and full name on the left, public navigation in the center, and language controls on the right. Mobile uses a compact brand, accessible expandable menu, and language control. Both layouts show active-page state. The footer provides branding, Teachings, About, Feedback, and the ministry's Telegram link.

## Architecture and language

Next.js App Router, strict TypeScript, Tailwind CSS, and npm lockfile. Separate public route-group layout from future admin layout. Maintain reusable shell and container components, shared control styles, language dictionaries, utilities, and static assets.

Public URLs: `/`, `/teachings`, `/teachings/[slug]`, `/about`, `/feedback`. Phase 1 implements the first, second, fourth, and fifth as placeholders. The detail route is documented only.

English and Amharic interface dictionaries are separate from future teaching content. Persist the device-local interface preference, set document language correctly, avoid hydration mismatches, and do not automatically translate articles. All initial Amharic wording is draft for client review.

Semantic HTML, visible focus, a skip link, accessible labels, keyboard/touch controls, Escape menu dismissal, and closure after navigation are required.

## Boundaries

Current authorized increment: Home has passed visual review. Build the Teachings Library with local sample search, topic/content-language filters, URL state, pagination, empty results and Home connections. Stop for library review; detail routes remain deferred. See `phase-2-library.md`.

The original delivery covered Phase 1 only. The subsequent request authorizes Phase 2's Home page visual preview only, using the approved references and documented sample data. Stop for visual review after Home. Do not connect Supabase, add authentication or databases, provision services, build admin screens, deploy, or implement other pages yet. Do not overwrite supplied references or unrelated files. Comments, audio uploads, public registration, and Telegram content migration are outside the initial scope.

## Acceptance

Run production build, strict type checking and lint. Check desktop/mobile shell, navigation, active states, menu, language switching and persistence, logo loading, keyboard focus, and horizontal overflow. Record actual checks and limitations separately from implementation claims.
