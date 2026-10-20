# Phase 2 — Teachings Library

Latest update (2026-10-10): Library layout and result counts have been polished; see `phase-2-library-polish.md` for the current two-column grid, compact cards, screenshots and verification. Teaching detail links are now functional, as documented in `phase-2-teaching-details.md`. The original delivery record below retains its historical context. Stop for Library visual review before Phase 3.

Completed for visual review on 2026-10-09. Scope: `/teachings` and Home connections only. No database, authentication, admin, deployment, or teaching-detail routes.

## Implementation

The library reuses the public shell, theme, dictionaries, and `TeachingCard`. It includes breadcrumb, introduction, labeled search and native selects, clear actions, responsive grid, results announcement, Load more, and empty results. Desktop has three columns, tablet two (640px+), and narrow mobile one. Gutters retain the existing 16/24/32px tokens.

`src/data/sample-teachings.ts` is the shared typed collection: 12 explicitly marked sample records, six English and six Amharic, covering all four topics. The first six follow the supplied desktop reference. Additional sample summaries demonstrate pagination and language filters; they are not published articles. No article body, real author/date, video URL, or detail slug is claimed. Home uses the first three records. Each record now has fixed title, description, topic and content language; changing interface language never changes teaching text. Original mockup copy is reused from the dictionaries when constructing fixtures, but is selected by the record's language, not the current UI. Amharic remains draft copy.

Interface labels remain in `src/i18n/en.ts` and `am.ts`. `src/lib/teaching-filters.ts` handles parsing, URL construction, and matching. `src/components/teachings-library.tsx` renders the library with a Suspense boundary in its route.

## URL behavior

- `q`: submitted keyword query, trimmed, Unicode-normalized and case-insensitive; all whitespace-separated terms must occur in the title or summary.
- `topic`: `repentance`, `sacraments`, `fathers`, or `apologetics`.
- `language`: `en` or `am`, independent of interface preference.
- `limit`: number displayed; defaults to six, Load more adds six. The URL preserves this on refresh and history traversal.
- Search submission and filter changes reset the limit to six. Clear filters removes all parameters and resets the search draft.
- Invalid topic/language values behave as All; invalid limits fall back to six. Filtering is local only.
- History uses push navigation, so Back/Forward restores the preceding query, selected filters, and count.

Home search submits to `/teachings?q=…`; topic cards link to `?topic=…`; View all opens `/teachings`. Read teaching remains disabled with a visible sample/unavailable explanation, never a broken detail link.

## Verification

- Production build, strict TypeScript, and ESLint passed on the final code.
- Load more: six to twelve records; Back restored six; Forward and refresh restored twelve.
- Changing topic after Load more removed the limit parameter.
- Combined `q=confession&topic=repentance&language=en` returned only Preparing for confession.
- `ንስሐ` search returned the two Amharic repentance examples.
- Switching UI to Amharic retained the English filter, URL, and English result text.
- A nonmatching query displayed the empty state; its Clear filters action restored the library.
- Home search returned the sacraments result; Apologetics linked to its two matching examples; View all opened the full library.
- Enter submitted search; native select/button keyboard behavior and visible focus checked. Read actions are disabled.
- Desktop 1487px, tablet 768px, mobile 390px and narrow Amharic 320px inspected; no horizontal overflow at checked widths.
- Screenshots: `docs/previews/phase-2-library-desktop.png` and `docs/previews/phase-2-library-mobile.png`. These are viewport captures because the browser's full-page stitching duplicated content during earlier testing.

Physical touch devices, other browser engines and screen readers were not tested. The earlier development-tool audit limitations remain unchanged. Stop here for library review; teaching details are the next step.
