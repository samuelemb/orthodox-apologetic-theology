# Phase 2 — Teaching Details

Implemented on 2026-10-09. Stop here for visual review. This request supersedes the older Library-only stopping instructions. No database, authentication, admin, comments, audio, or deployment was added.

## Implementation

All 12 records in `src/data/sample-teachings.ts` now have stable slugs and clearly labeled draft article sections. `/teachings/[slug]` resolves the shared dataset; unknown slugs invoke Next notFound and show a localized library link. Content is sample material pending client review, not approved published theology. English/Amharic repentance is the only manually linked translation pair. Other records deliberately omit translation actions. Article/title/summary language attributes are independent of the persisted interface language; switching the UI retains the current article and route. Amharic copy requires client review.

The shared header/footer, theme tokens, fonts, narrow outer gutters and existing Home/Library controls remain. Desktop has a sticky On this page sidebar; mobile uses native details/summary above the article. Both build links from the same section heading records and targets. Prose has the existing 46rem reading measure. Related teachings link to working routes. Screenshots follow the supplied references' hierarchy, with an explicit sample notice and a true 16:9 video region; this makes the desktop page taller than the reference's wide banner.

Home and Library Read teaching actions are now links. Library cards carry canonical q/topic/language/limit state in a `library` query parameter. The detail breadcrumb, translations and related links retain it; return paths are restricted to the library and normalized with the existing filter helper. Browser Back also retains the original URL. Zero results now say “0 teachings found” / “0 ትምህርቶች ተገኝተዋል”. Notices explain the sample content instead of claiming reading is unavailable.

## YouTube

No approved video ID was found in source, assets or project notes. The English repentance sample therefore has a clearly labeled CSS preview placeholder, without a playable control or a fabricated thumbnail/video. All other samples omit the section. An optional video record renders a responsive privacy-enhanced YouTube iframe only for an 11-character ID containing letters, digits, underscore or hyphen. It has a title, fullscreen support and no autoplay. Format validation cannot establish ownership, approval or remote availability. Actual playback remains unverified until an approved video is supplied.

## Verification

Final production build, strict TypeScript and ESLint passed. Automated Chrome browser checks used the production server on loopback port 3001; the existing server on 3000 was also inspected for Library console messages.

- All 12 Library destination routes returned HTTP 200; Home Read teaching and related links worked.
- Combined submitted confession search, repentance topic and English filter returned Preparing for confession. The detail breadcrumb returned to exactly that filtered URL and its one result.
- Load more rendered all 12 records. Existing URL filtering and Home sacraments search worked.
- Desktop and mobile section links reached the corresponding heading hash. Mobile disclosure opened and exposed its links.
- Switching UI to Amharic retained the English article/title; translation navigation reached the Amharic article with lang=am and returned to English with lang=en.
- Nontranslated/video-free articles omitted those actions/sections.
- Missing slug showed the proper teaching-not-found UI, library link and HTTP 404. Empty counts checked in both UI languages.
- No horizontal document overflow at 320, 390, 768 and 1536px. Desktop 1536px and mobile 390px screenshots visually inspected.

Console investigation reproduced missing `/favicon.ico` resource messages. Root metadata now uses the existing supplied logo as the icon, eliminating these messages in the final production and existing Library checks. No JavaScript page errors or hydration warnings appeared. The sole remaining console error in the final run was the expected HTTP 404 from deliberately requesting `/teachings/nonexistent`. The precise historical review indicator cannot be attributed conclusively without its original log; no other application error was reproduced. Final captured messages are in `docs/previews/teaching-details-browser-check.json`.

Screenshots: `docs/previews/phase-2-teaching-details-desktop.png` and `docs/previews/phase-2-teaching-details-mobile.png` (full-page Chrome captures). These include the retained shared footer and video placeholder.

Limits: physical touch devices, other browser engines, screen readers and real YouTube playback were not tested. Sample theology, translations and interface Amharic await client approval. Existing development-tool audit limitations remain as documented in README. No further Phase 2 pages were implemented.
