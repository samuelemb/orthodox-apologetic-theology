# Phase 2 — Teachings Library layout polish

Completed 2026-10-10. Stop for visual review before Phase 3. This is a Library-only layout/count update; no database, authentication, admin, delivery or deployment work was started.

## Changes

- `.library-grid` stays one column below 640px and two equal columns at 640px and above. Removed the former desktop three-column override. Explicit `repeat(2, minmax(0, 1fr))` makes the column count depend on viewport width, including when only one match exists or the final row contains one card.
- Library cards use 20px padding on mobile and 24px at tablet/desktop widths. Metadata-to-title and title-to-description gaps are 10px. Descriptions have a 24px bottom margin; the existing flex layout with `margin-top: auto` keeps reading links aligned at the bottom of each grid row. The shorter card in a mixed-language row can have additional space before its link to maintain this alignment.
- Cards have no imposed height or oversized minimum height. Grid tracks and cards permit natural wrapping. No fixed prose heights, clipped overflow or forced line breaks were introduced.
- Counts now use “0 teachings found”, “1 teaching found”, or “2 teachings found”/the appropriate total when every match is visible. While further matches remain, the status says “Showing 6 of 12 teachings.” Equivalent singular/plural/partial Amharic messages were added to the existing dictionaries. The existing status region remains in place.
- CSS changes are scoped to `.library-grid` and `.library-page`; the shared `TeachingCard` component and Home styles were not changed. Font families, weights, sizes, line heights, colors, focus indicators and 16/24/32px outer gutters are preserved. Filtering, URL parsing/building, sample records and pagination functions were not changed.

## Verification

`npm run build`, `npm run typecheck` and `npm run lint` passed on the final implementation.

The browser script `scripts/library-layout-review.cjs` checks 84 combinations: both interface languages, 1536/1024px desktop, 768/640px tablet, 390/320px mobile, and 0/1/2/4/6/7/12 visible results. The two-result Church Fathers and four-result repentance views contain both English and Amharic teaching records. The seven-result view checks an incomplete final row while more matches remain.

- Grid track count remains two at all tablet/desktop widths, even with one result. Every card, including a single final card, measures the normal track width. Mobile stays one column.
- Actual padding measures 24px tablet/desktop and 20px mobile. Metadata/title gaps measure 10px. Description/link gaps are at least 24px and reading-link tops align within each two-card row. Cards have computed `min-height: auto`.
- No document or card horizontal overflow in any of the 84 cases. Longer English/Amharic titles and descriptions wrap naturally; mixed-language two/four-result desktop and mobile screenshots were visually inspected.
- Result status text matches each visible/total count in both languages, including zero, singular, fully visible and partially visible matches.
- Load more changes six to twelve and disappears once all matches are visible. Back restores six; Forward and refresh restore twelve and its URL state. Topic changes reset the limit.
- Combined confession query + repentance topic + English teaching-language filter yields one record. Back/Forward restores search input, selected filters and results. Switching the interface to Amharic preserves the URL, English teaching filter, English title, font family and weight.
- Reading a filtered teaching opens its detail route with the library return URL. Back restores the same filtered result. Clear filters resets the URL and controls; the empty-state clear action restores the default library. Amharic keyword search returns Amharic records.
- Keyboard Enter submits search and activates Load more. The Load more button retains the visible shared 3px focus outline. Existing semantics/native select controls remain unchanged.
- Home was checked in both interfaces: its desktop teaching grid remains three columns, its card padding remains 16px vertically/24px horizontally, and English descriptions retain their original zero bottom margin.
- No JavaScript page errors. Full results and measurements are in [browser evidence](previews/library-polish-browser-check.json).

## Screenshots

| Interface | Desktop: two results | Desktop: four results | Mobile: four results |
| --- | --- | --- | --- |
| English | [Two](previews/library-polish-en-1536-2-results.png) | [Four](previews/library-polish-en-1536-4-results.png) | [Mobile](previews/library-polish-en-390-4-results.png) |
| Amharic | [Two](previews/library-polish-am-1536-2-results.png) | [Four](previews/library-polish-am-1536-4-results.png) | [Mobile](previews/library-polish-am-390-4-results.png) |

Screenshots hide the Next development indicator only during capture. Test data remains the existing local sample teaching collection.

## Limits

Verification used installed desktop Chrome with emulated viewport widths against the local development server. Physical tablets/phones, other engines and actual screen-reader announcements were not tested. Amharic wording remains subject to client/native-language review. No Phase 3 or deployment work was performed.
