# Phase 2 — Home visual preview

Historical visual-review record. Home subsequently passed review. Search, topic cards and View all are now enabled; shared sample records keep fixed content languages. See `phase-2-library.md` for current behavior.

Only the Home placeholder was replaced. Existing routing, shared header/footer, language provider, tokens, and other placeholder pages are preserved. No dependencies, database, admin features, or deployment were added.

## Design

Uses the approved desktop/mobile references: two-line serif hero with red emphasis; original circular logo at desktop widths; stacked mobile search controls; four gold line-icon topics (four columns on desktop, two on mobile); three teaching cards (one column on mobile); warm About/Telegram callout. Gutters remain 16px mobile and 24–32px desktop. The large hero logo is hidden on mobile as in the reference; the original header/footer logos remain. Decorative topic arrows are hidden below 384px to retain readable labels. The existing shared footer, including its Telegram link, is preserved.

Two small preview notices are deliberate additions to the reference: unavailable search/teaching controls and sample teaching content are visibly identified. Search input/button, topic cards, View all, and Read teaching use native disabled semantics and do not submit, navigate, or manufacture results. Both About links target `/about`; the callout links to https://t.me/orthodox_chrstianity.

## Sample content

`src/data/sample-teachings.ts` contains a typed readonly fixture collection with stable sample IDs, topics, dictionary copy keys, and `status: "sample"`. The three titles and summaries reproduce the approved mockup, not real published articles. There are no invented article bodies, authors, dates, slugs, or video links. Sample display copy and draft Amharic equivalents live under `home.samples` in `src/i18n/en.ts` and `am.ts`. These are manually authored design fixtures, not automatic article translation. Later database content must carry its own language and replace the fixture input; interface language must remain independent.

Reusable components: `HomePageContent`, `TopicCard`, `TopicIcon`, `TeachingCard`. Styling extends the existing `src/styles/theme.css`, scoped to Home elements. No new UI library or icon dependency is needed.

## Checks performed

- `npm run build`: passed after final CSS change; four public routes generated.
- `npm run typecheck`: passed.
- `npm run lint`: passed without warnings.
- Production browser review at 1536px desktop, 390px mobile, and 320px narrow mobile.
- No horizontal document overflow at checked widths; all four topic cards fit their boxes at 320px after the spacing adjustment.
- Four topic cards and three teaching cards confirmed in the accessibility tree; search and all teaching controls reported disabled.
- Desktop hero/header/footer logos loaded successfully.
- About ministry link navigated to the existing About page; purpose link also targets `/about`.
- Telegram callout destination verified in rendered DOM; no external channel interaction performed.
- English/Amharic switch updates Home content; Amharic persists on reload. No browser warning/error logs in the checked flow.
- Screenshots saved in `docs/previews/phase-2-home-*.png`.

Browser testing used Chromium viewport emulation, not physical touch devices or other browser engines. Amharic wording remains draft for client review. Phase 1's documented tooling audit limitations remain unchanged. Stop here for Home visual review; no further Phase 2 pages have been started.
