# Phase 2 — Teaching translations

Implemented 2026-10-10 using local sample data only. Stop for review. Phase 3 has not started; no database, admin, authentication, service provisioning or deployment was added.

## Existing relationships and resulting totals

The existing model links the repentance pair. The client explicitly confirmed the confession, sacraments, baptism, Church Fathers and sacred tradition pairs. All six relationships are now authored in the data; none were inferred from titles or topics.

The result is **6 unique teachings and 12 language versions** (six English, six Amharic). Every current sample teaching has both versions. Additional relationships still require an explicit authored link.

| Stable teaching ID | English slug | Amharic slug |
| --- | --- | --- |
| `sample-repentance` | `what-is-repentance` | `repentance-am` |
| `sample-sacraments` | `understanding-the-sacraments` | `sacraments-am` |
| `sample-fathers` | `learning-from-the-church-fathers` | `fathers-am` |
| `sample-tradition` | `tradition` | `tradition-am` |
| `sample-confession` | `preparing-for-confession` | `confession-am` |
| `sample-baptism` | `baptism` | `baptism-am` |

All twelve detail URLs, version titles, excerpts, sections, language values and version IDs are retained. Reciprocal translation actions are available for all six confirmed pairs.

## Model

`src/data/sample-teachings.ts` exports `sampleTeachingVersions` for exact slug resolution and `sampleTeachings` for grouped listings. Each `TeachingVersion` retains its original `id`, `slug`, `language`, `title`, `description`, article `sections` and optional `translationSlug`, and now carries its stable `teachingId`. Each grouped `SampleTeaching` has a stable `id`, topic, sample status and `versions` collection.

`linkedTeachingIds` assigns each confirmed pair to the existing English record’s stable teaching ID. Unlinked versions continue to use their own record ID. `groupTeachingVersions` groups by authored identity only, preserving first-occurrence order. It never compares names or topics to infer relationships.

The detail route resolves `sampleTeachingVersions` by exact slug. Card keys, card heading IDs and related exclusions use the grouped teaching identity. `preferredVersion` selects the requested interface language when present, otherwise the existing available version.

## Listing, filters and search

- Library and Home render one card per grouped teaching. Home retains its existing first-three teaching order and three-column desktop/single-column mobile grid. All three cards display the interface-language version; single-language fallback remains supported.
- Cards contain a plain displayed-language label and one reading link. Library, Home and related entries have no translation buttons or links. “Read teaching” opens the title/excerpt version displayed on that card and carries the filtered-library return URL.
- A specific teaching-language filter restricts both matching and display to that language. Interface switching does not rewrite search, topic, teaching-language or limit URL state.
- All languages searches each available version's **title and excerpt only**, using the existing Unicode normalization, case handling and all-keyword matching. Every keyword must match the same version; words spread across separate translations do not create a synthetic match.
- A teaching is returned once if any eligible version matches. Display prefers the interface-language version among the matching versions; if that version does not match, another matching version is shown. No content is automatically translated.
- Grouping and filtering happen before slicing for pagination. All six unique teachings are visible immediately, so All languages shows “6 teachings found” and no Load more button. The existing Load more behavior remains available when more than six unique matches exist. Each specific language filter returns six unique teachings. Counts use the existing singular/plural/partial English and Amharic messages.
- Related teachings are selected from groups and exclude the current teaching's ID, including every translation of that teaching. Related entries use the preferred available version, with one article link and a plain language label.
- Switching the interface on an article changes interface labels and related-version preferences, while the current article URL, title and content language remain unchanged. Only explicit article-language navigation opens another version.

Fonts, weights, colors and gutters are unchanged. The polished two-column Library and mobile one-column layout remain in place. Card footers contain only the reading link, retaining natural wrapping and existing touch/focus styling. No fixed card heights or clipped text were introduced.

## Article-language controls

Teaching Details labels the current content language as “Article language” / “የጽሑፉ ቋንቋ”. A translation link appears only when an available version has the same stable teaching ID and a different language. Lookup uses grouped identity rather than trusting a slug alone. Switching follows that version’s existing slug, preserves the sanitized filtered-library return context and leaves interface language unchanged. Interface switching never replaces the current article version. A single-language article shows the language as plain text, with no translation link or disabled option.

The current data has only `status: "sample"`, with no publication-status field. These explicitly available local sample versions remain review content. There is no unpublished translation collection to expose; a future publishing model must filter available versions by publication status before listing or resolving them. No automatic translations were generated.

## Verification

`npm run build`, `npm run typecheck` and `npm run lint` passed. `node scripts/teaching-translations-review.cjs` checks the actual TypeScript model/selection functions in memory, then runs the browser flows. `node scripts/teaching-language-states-review.cjs` additionally checks article switching, single-language states and actual Load more controls using temporary local fixtures restored in `finally`. Run these scripts sequentially; the second temporarily edits sample data.

- Model checks: six stable group IDs, twelve unique slugs, exactly six two-version groups, reciprocal translation identity, six eligible teachings per specific language, fallback selection, and independent IDs remaining separate despite similar version data.
- Search checks: English-only match, Amharic-only match, a question-mark query matching both translations but returning one group, interface preference among matching versions, specific-language exclusion, topic filtering and unchanged title/excerpt search scope (article-body-only terms do not match).
- Library matrix: both interface languages × All/English/Amharic teaching filters × 1536/768/390/320px = **24 cases**. Each case checks unique card IDs, the selected content language, exact read/version destinations, count text, overflow, grid columns and card padding. Reading links remain aligned within desktop/tablet rows.
- Home: three unique cards in both interfaces at 1536/390/320px; the existing desktop/mobile column counts and no document overflow. Preferred and fallback versions are labeled and reachable.
- All twelve existing slugs return HTTP 200 and their original title/language in both interfaces (**24 article checks**). Each related entry has just one article link and excludes the current shared teaching ID; related IDs are unique. No document overflow on the checked 320px article views.
- Pagination: all six current groups appear once, with no Load more button. A legacy `limit=12` URL, refresh and Back/Forward still show six unique groups. Filter changes reset the limit. An eight-group single-language unit fixture verifies fallback discovery and unique slices. A temporary eight-group browser fixture verifies the actual Load more button (six to eight unique cards), Back/Forward and refresh.
- Combined search/topic/English filter survives switching to an Amharic interface unchanged. Selecting the paired Amharic article link, switching interface again, following the reciprocal English translation action and returning through the breadcrumb preserve the filtered-library context.
- All-languages search uses the matching English version in an Amharic interface when the Amharic version does not match. Restricting to Amharic excludes that English-only match. Amharic-only search displays the Amharic version. Clear filters resets the URL.
- Article-language switches and card reading links retain the visible shared 3px focus outline. No JavaScript page errors. Grouped desktop/mobile and language-filter screenshots, plus Amharic Home desktop, were visually inspected.

- Article controls: bilingual screenshots in both interface languages at 1536/390/320px; translation navigation keeps the same teaching and interface. Single-language English and Amharic article fixtures in both interfaces omit the switch and show no overflow at those widths. All temporary changes are restored afterward. Fixture recompilation can briefly produce stale SSR/client data during development; the fixture test reloads before checking the settled state. The restored-data review script reports no page errors.

Evidence: [browser/model report](previews/teaching-translations-browser-check.json). Screenshots hide the Next development indicator only during capture.

## Screenshots

| Teaching-language filter | Desktop, English interface | Mobile, English interface |
| --- | --- | --- |
| All languages | [Grouped cards](previews/teaching-translations-en-all-1536.png) | [Grouped cards](previews/teaching-translations-en-all-390.png) |
| English | [English filter](previews/teaching-translations-en-en-1536.png) | [English filter](previews/teaching-translations-en-en-390.png) |
| Amharic | [Amharic filter](previews/teaching-translations-en-am-1536.png) | [Amharic filter](previews/teaching-translations-en-am-390.png) |

Amharic-interface screenshots use the equivalent `teaching-translations-am-all/en/am-1536/390.png` filenames in `docs/previews`. Home previews are `teaching-translations-home-en/am-1536/390.png`.

| Article state | Desktop | Mobile |
| --- | --- | --- |
| Bilingual | [Article switch](previews/article-language-bilingual-en-1536.png) | [Article switch](previews/article-language-bilingual-en-390.png) |
| Single-language test fixture | [No switch](previews/article-language-single-fixture-en-en-1536.png) | [No switch](previews/article-language-single-fixture-en-en-390.png) |

All six real sample teachings are bilingual. Single-language screenshots show a **temporary test fixture** with the confession translation removed from availability; they do not describe the restored sample dataset. Equivalent Amharic-content/interface captures are in `docs/previews/article-language-*`.

## Limits and future work

Tests used installed desktop Chrome with viewport emulation against the local development server; physical devices, other browser engines and spoken screen-reader announcements were not tested. Sample theology and Amharic wording remain subject to client review. All current records are paired; independent single-language fixture checks preserve support for future unlinked teachings. Real publishing/data storage remains Phase 3/future work and was not started.
