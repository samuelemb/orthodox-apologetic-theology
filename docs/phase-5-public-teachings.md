# Phase 5A — Published public teachings

Implemented 2026-10-16. Home, Library, Teaching Details and related-teaching cards now read real published Supabase records. Public Feedback remains preview-only. No deployment, migration, seed, owner-account change or modification of pre-existing teaching content is part of this phase.

## Public data boundary

`src/lib/public-teachings.ts` is server-only. It creates an independent Supabase client from the existing public URL and publishable key. It has no cookie adapter, owner JWT, auth storage, URL session detection, persisted session or refresh mechanism. The visitor's authenticated owner session is never passed to this client. Existing anonymous RLS policies govern every query; explicit `status = published` predicates additionally constrain translation queries. No privileged key or owner helper is used for public reads.

The catalog selects only published translation metadata and an inner join to teaching topic metadata. It uses ID keyset batches of 200, avoiding the API row limit; an error in any batch fails the read rather than presenting a partial list as complete. Draft-only teachings cannot appear. Draft versions cannot contribute titles, excerpts, slugs or language availability. Article JSON is fetched separately for the selected published slug, validated with the existing article validator, and rendered through `ArticleBody`. Stored video IDs are validated before constructing the shared controlled YouTube-nocookie embed. Submitted strings remain escaped React text.

Runtime types, grouping and URL helpers now live in `src/lib/teaching-model.ts`, independent of sample fixtures. Sample fixture files remain for historical design/seed tooling, but public components no longer import them. No samples are used as a fallback on empty data or database errors.

## Selection and navigation

Grouping uses the stable teaching ID: one card per teaching regardless of translation count. Home shows the latest three teachings ordered by the newest published version's publication timestamp, with a stable ID tie-breaker. Editing a published version does not move its publication date.

The existing Library search normalization, all-term title/excerpt matching, topic filter, Teaching language filter, six-card Load more increments, result counts and URL parameters remain in use. Search sees only published metadata. An explicit Teaching language filter restricts matching versions first. Otherwise, the interface language is preferred among search-matching versions, with an available-language fallback. A fallback card is explicitly labeled Available in [language] (localized). Both versions remain grouped as one card.

Version switching appears only in Teaching Details and links only to another published version under the same teaching. Slugs remain per version, and translation/related links preserve the normalized, internal filtered Library return URL. Related teachings prefer the same topic, exclude the current teaching, honor an explicit return-library language, and otherwise prefer the interface language. The article excerpt now always comes from the stored record; the old special-case sample repentance introduction is removed.

Approved fonts, colors, layout classes and responsive styles are retained. Obsolete sample notices were removed from Home, Library and Details; About's sample-content sentence and the admin publication notice were updated in both languages. Public Feedback copy and submission behavior remain unchanged.

## Freshness, missing and unavailable states

Home, Library and Details are force-dynamic. Supabase HTTP reads explicitly use `cache: no-store`, have a 20-second timeout and use no shared application cache. Public article links disable prefetch. A new public request therefore rechecks current anonymous visibility and content: publishing appears, editing published text updates it, and unpublishing removes it. There is no cached sample fallback or revalidation interval.

A successful empty catalog shows an explicit localized no-published-teachings state. Filtered searches with no matches retain the existing clear-filters state. A successful lookup with no published slug calls `notFound()` (404), equally for absent and draft-only slugs. Database/configuration/invalid-article failures render a separate localized retryable unavailable message instead of an empty or missing article. These handled unavailable views use the page response's normal HTTP status; they are not a custom 503 endpoint. Failure does not display a partly loaded catalog.

Already displayed pages and browser history are snapshots until navigation/reload causes another request; no polling, push invalidation or real-time updates are added. Previously downloaded public content cannot be recalled after unpublishing. The freshness guarantee covers subsequent server requests, not instant removal from an already open tab.

## Setup and verification

Existing configured Supabase URL/publishable key and Phase 3/4B migrations are sufficient; no new dependency or environment key is required. The permanent owner and existing content are retained.

Focused runner: `scripts/hosted/public-teachings-test.mjs`. It uses separate run-marked temporary Auth/allowlist setup, ordinary owner-session fixture writes, exact teaching-ID cleanup, and before/after checksums for existing teachings/translations and owner memberships. Runtime application reads always remain anonymous. The ignored `.tools/public-read-preload.mjs` and `.tools/public-read-mode.txt` are test-only Node fetch instrumentation for the local production server; neither is imported by application code or deployed. Empty/outage tests return controlled anonymous REST results without deleting/unpublishing existing content.

### Executed verification and cleanup

Final evidence: `verification/phase-5-public-tests.json` (all six groups passed).

1. Anonymous and signed-in temporary-owner public HTML/RSC responses on Home, Library and Details omitted draft markers; mixed English-published/Amharic-draft teaching had no Amharic switch; draft slugs returned 404. Public responses had no-store cache headers.
2. Nine isolated published teaching groups produced six initial cards and nine after Load more. Two published versions produced exactly one card. Amharic interface preferred the published Amharic version; English-only teachings showed a localized fallback label. Explicit English filtering selected English despite the Amharic interface.
3. Per-version slug switching, retained filtered-Library links, related-card bounds and the shared controlled YouTube embed were verified using a bilingual published record.
4. Search plus topic/language filters, counts, Load more, URL state, Back/Forward and no-match search behaved correctly.
5. A previously draft version appeared after publishing. Its title/excerpt edits appeared in subsequent article/Library responses. After unpublishing it, its article returned 404 and its changed title disappeared from Library responses.
6. Test-only anonymous REST fault injection produced actual empty-result handling on Home/Library and 404 for an absent article; an injected database error produced the retryable error view on all three routes, not missing/empty copy. English/Amharic behavior, absence of browser JavaScript errors and no mobile horizontal overflow at 390 pixels were checked. One Amharic mobile Library capture was visually inspected.

TypeScript, lint and build passed. TypeScript was rerun after correcting a narrow language-union type error; final lint included the newly added focused runner. Production build reports Home, Library and article routes as dynamic; public Feedback remains static. The first focused browser run stopped on a stale admin-style selector (EN rather than the public button's accessible name English), cleaned up its fixtures, and the corrected focused run passed. No unrelated previous-phase suites were repeated.

The final run created ten isolated teachings (thirteen translations), including draft-only, mixed-status, bilingual published and English-only records, plus one run-marked temporary owner. Only those exact teaching IDs were deleted through the ordinary owner's RLS client. Existing teaching/translation checksums and original owner memberships matched their pre-run values; the temporary owner was removed. No existing teaching, publication status or permanent account was changed. No seed was loaded.

Limitations: headless Chrome and viewport emulation rather than physical phones/other engines; no screen-reader or YouTube playback audit; no high-volume/performance or concurrent-publication stress test. Published catalog metadata is currently loaded in batches and filtered in the browser, so very large libraries may need a future server-side search/pagination design that retains these grouping rules. No real-time updates are implemented. Empty and outage conditions used local fetch fault injection rather than an actual database outage. The temporary local production server was stopped after verification.

Phase 5A stops here for review; Feedback submission, deployment and additional phases remain excluded.
