# Amharic typography visual review

## Current trial: Benaiah

The client’s latest font trial uses `src/fonts/benaiah.ttf`, copied unchanged from the supplied Benaiah font and loaded through the existing `next/font/local` Ethiopic variable. The internal family is Benaiah, style Bold, weight 700. All Amharic text uses this real static face with synthetic styling disabled. Existing language targeting, sizes, line heights, colors, layouts and gutters are retained. English continues using Chakra Petch.

Build, TypeScript and lint passed. Thirty browser cases across About, Home, Library and both article languages, in both interfaces at 1536/390/320px, showed no document overflow or JavaScript page errors. About mobile was visually inspected. [Desktop preview](previews/typography-benaiah-am-1536.png), [mobile preview](previews/typography-benaiah-am-390.png), [browser evidence](previews/typography-benaiah-checks.json). Chrome viewport emulation was used; physical devices and other browser engines were not tested. Stopped for font review; Phase 3 remains untouched.

Earlier entries below are historical and describe the implementation state at the time.


Updated 2026-10-10. New page development is paused. Feedback remains its existing placeholder. This is ready for visual review; no deployment was performed.

## English companion font

The client's latest request authorizes changing English typography to resemble Bela Bereka. The supplied Bela Bereka cmap lacks Latin alphabet glyphs, so English now uses Chakra Petch as a squared, angular companion. It is loaded through the existing `next/font/google` setup with actual 400/500/600/700 weights. Both former English sans and serif roles now use Chakra Petch; English headings and brand use Bold 700, paragraphs retain Regular 400, and controls keep their existing restrained weights. English heading letter spacing is normal. Amharic continues using Bela Bereka; text language targeting remains independent of interface language. Earlier statements about preserving the old English fonts are superseded by this request.

Build, TypeScript and lint passed. The 30-case browser matrix covering About, Home, Library and both teaching languages in both interfaces at 320px, 390px and 1536px passed without document overflow or JavaScript page errors. English About desktop/mobile screenshots were visually inspected: [desktop](previews/typography-english-companion-en-1536.png), [mobile](previews/typography-english-companion-en-390.png). Evidence: `previews/typography-english-companion-checks.json`. Development remains paused for visual review; Feedback remains unimplemented.

## Previous font: Bela Bereka

The client's latest selection replaces Loga Comic with `src/fonts/bela-bereka.ttf`, copied unchanged from the supplied font and loaded through `next/font/local`. Its internal family is Bela Bereka, style Bold, weight 700; it has one static face. All Amharic text now uses that supplied Bold face, with synthetic styling disabled. English font families and weights remain explicitly preserved across interface languages. Sizes, line heights, spacing and gutters are retained.

Build, TypeScript and lint passed. The 30-case browser matrix found no horizontal document overflow or JavaScript page errors. Updated About previews were visually inspected: [desktop](previews/typography-bela-am-1536.png), [mobile](previews/typography-bela-am-390.png). Evidence: `previews/typography-bela-checks.json`. Development remains paused for visual review; Feedback is unimplemented.

## Previous font: Loga Comic

The client's latest font selection supersedes Zemenay: `next/font/local` now loads the supplied Loga Comic Regular at weight 400 and Loga Comic Bold at weight 700. Amharic h1/h2/h3 headings (including nested accent text) and the mobile contents heading use the real Bold face. Paragraphs, navigation, buttons and other Amharic text use Regular. Language targeting, spacing and English font settings are preserved; synthetic bold remains disabled.

Build, TypeScript and lint passed. All 30 browser combinations across About, Home, Library and both teaching languages at 320px, 390px and 1536px passed with no horizontal document overflow or JavaScript page errors. About desktop and mobile screenshots were visually inspected. Current previews: [desktop](previews/typography-loga-am-1536.png), [mobile](previews/typography-loga-am-390.png). Browser evidence: `previews/typography-loga-checks.json`. Stopped for visual review; Feedback remains unimplemented.

## Previous font: Zemenay

At the client's subsequent request, replaced Noto Sans Ethiopic with the supplied `Zemenay_Regular_Abel_Yeshewalem_c74cc019f5.ttf`, copied unchanged to `src/fonts/zemenay-regular.ttf` and loaded with `next/font/local` through the existing `--font-ethiopic` variable. English Noto Sans and Noto Serif remain unchanged. The font names identify it as Zemenay Regular; it is a static face (its internal OS/2 weight field is 700 despite the Regular name). It is exposed as the requested regular face at CSS weight 400, with all Amharic text using that single real face and `font-synthesis: none`. The earlier 500/600 Amharic weight settings below are superseded; sizes and spacing remain as documented.

Build, TypeScript and lint passed again. The same 30-case browser matrix passed with no document overflow or JavaScript page errors. Desktop and 390px About screenshots were visually reviewed with the new font. Updated evidence is `previews/typography-zemenay-checks.json`; current screenshots are [desktop](previews/typography-zemenay-am-1536.png) and [mobile](previews/typography-zemenay-am-390.png). Earlier screenshots remain available for comparison. Development remains paused for visual review.

## Changes

Reused the variable Noto Sans Ethiopic already supplied through `next/font/google` in `src/app/layout.tsx`; no duplicate font download or alternate font loader was added. Amharic styles use `:lang(am)`, which follows the nearest declared language, rather than assuming every record matches the interface language. This covers the header brand, navigation, controls, footer, teaching cards, article headings, prose, and table of contents. Explicit English records retain the Latin font families, sizes, spacing, and line heights used in the English interface. Removed the old interface-wide heading overrides that affected English records in an Amharic interface.

Amharic headings use real weight 600, normal letter spacing and 1.4 line height. Main headings scale from 30px mobile to 48px desktop; section headings scale from 24px to 30px. Body text scales from 17px to 19px, with weight 400 and line height 1.75. Navigation and buttons use 17px and weight 500; card headings use 22–26px. Synthetic font styling is disabled for Amharic. Labels and small notices use 16px.

About's title is reduced from approximately 69px desktop / 35px mobile to 48px / 30px. Its introduction now follows the body scale rather than growing to almost 30px. Logo width is 200px desktop and 148px mobile. Prose is capped at 42rem, headings have a consistent 12px gap before paragraphs, and explanatory sections have 28px gaps. Topic rows use 18px text, 1.6 line height and 12px vertical padding. The bottom callout uses moderate padding and a two-column desktop layout with its two actions stacked on the right; mobile stays stacked. Existing 16/24/32px outer gutters are preserved.

The Amharic Home heading permits natural wrapping across its accent span, with a word space between the two pieces of copy. English retains its existing block accent layout.

## Verification

- `npm run build`, `npm run typecheck`, and `npm run lint` passed.
- Browser matrix: About, Home, Library, Amharic repentance article and English repentance article, each in both interface languages at 320px, 390px and 1536px (30 page/viewport/language combinations).
- No horizontal document overflow or JavaScript page errors in that matrix. Desktop and mobile About screenshots were visually inspected, including 320px wrapping. Home, Library and Teaching Details screenshots were inspected for spacing, mixed-language rendering and wrapping regressions.
- English About's sampled heading, paragraph, brand and navigation computed styles match the before baseline. English teaching text styles match between English and Amharic interfaces. The Amharic language-toggle label intentionally receives the new Amharic font/weight in either interface.
- The existing font setup supplies the actual variable font weights; no forced line breaks, fixed prose heights, hidden overflow, or new gutter rules were added.

Evidence: `docs/previews/typography-before-checks.json` and `typography-after-checks.json`; reproducible browser capture script: `scripts/typography-review.cjs` (uses the bundled Playwright package and installed Chrome against the running local server on port 3000). Screenshots include the existing Next development indicator. Verification used desktop Chrome viewport emulation, not physical mobile devices or other browser engines. Amharic wording and final visual approval remain with the client.

## About screenshots

| Viewport | Before | After |
| --- | --- | --- |
| Desktop, 1536px | [Before](previews/typography-before-am-1536.png) | [After](previews/typography-after-am-1536.png) |
| Mobile, 390px | [Before](previews/typography-before-am-390.png) | [After](previews/typography-after-am-390.png) |
| Narrow mobile, 320px | Baseline computed styles in JSON | [After](previews/typography-review--about-320.png) |

English About before/after captures and other public-page review captures are also in `docs/previews/`.
