# Phase 2 — About

Implemented on 2026-10-09. Stop after About for visual review. This request supersedes the older Library/Teaching Details stopping instructions. No database, admin, authentication, deployment, or Telegram migration work was added.

## Implementation

`/about` replaces its placeholder with a bilingual page using the existing dictionaries, language provider, public shell, fonts, colors, controls and 16/24/32px gutters. It includes Home / About breadcrumb, purpose label, introduction and unmodified original logo, three explanatory sections, topic navigation and a bottom Browse teachings/Telegram callout. Desktop uses content and sidebar columns; smaller screens stack the logo, content, topics and callout. Logo dimensions remain proportional.

Copy explains organizing Orthodox teachings for discovery, repentance, sacraments, Church Fathers and apologetics, keyword searching, topic browsing and choosing teaching language separately from interface language. It describes a new library where the owner will publish teachings and identifies the current sample content. It makes no claim that Telegram posts have been imported and supplies no founder details, endorsements or ministry history. **All new English and Amharic copy is draft, pending client review.**

All four topics link to the existing `/teachings?topic=…` filter, with `fathers` used for Church Fathers. Browse teachings opens `/teachings`; Telegram uses the existing `https://t.me/orthodox_chrstianity`. Existing Home links continue to open About.

Teaching Details has one shared CSS adjustment: iframe and placeholder maximum width is 960px. It remains left-aligned at the article edge and retains the existing responsive width and 16:9 aspect-ratio declaration. No article, mobile styling or outer gutters were changed.

## Verification

- Production build, strict TypeScript and ESLint passed.
- Production browser checks used installed Chromium against loopback port 3002. About was checked in English and Amharic at 1536, 768, 390 and 320px. No horizontal document overflow was found; original logos loaded with square proportions.
- Desktop 1536px and mobile 390px full-page screenshots were visually inspected in both languages.
- Every topic link was clicked in both interface languages. The library selected the matching filter and showed four repentance, four sacraments, two Church Fathers and two apologetics sample records.
- Browse teachings and both Home-to-About links navigated successfully in both languages. Telegram's rendered destination was verified; no external channel interaction was performed.
- Keyboard Tab traversal reached the topic links and callout with visible focus. Skip link moved focus to main content; mobile menu opened with Enter and closed with Escape. Existing language preference persisted through navigation/reload.
- Video placeholder measured 960 × 540px at 1536 and 1920px desktop, and 358 × 201.375px at 390px mobile, left-aligned with the article. No horizontal overflow at these widths or 320px.
- No browser console errors or JavaScript page errors occurred in the final run. Evidence is saved in `docs/previews/about-browser-check.json`.

Screenshots: `docs/previews/phase-2-about-desktop.png`, `phase-2-about-mobile.png`, `phase-2-about-desktop-am.png`, and `phase-2-about-mobile-am.png`.

## Limits

The existing video placeholder at 320px has enough text to expand to 288 × 186.094px despite its 16:9 CSS declaration. This pre-existing narrow-mobile behavior was preserved as requested; exact 16:9 was confirmed at 390px mobile and desktop. No approved video exists, so actual iframe playback remains unverified. Physical touch devices, other browser engines, screen readers and external Telegram availability were not tested. Draft copy awaits client review; the development-tool limitations in README remain.
