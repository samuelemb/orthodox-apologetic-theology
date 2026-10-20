# Phase 2 — Feedback

Implemented 2026-10-10. This request supersedes the earlier instruction to defer Feedback. Stop after this page for visual review. No backend, database, authentication, admin, email delivery, service provisioning or deployment was added.

## Layout and copy

`/feedback` now renders the bilingual Feedback page inside the shared public layout. It reuses the original logo, navigation/footer, `Container`, language provider, dictionary structure, form controls, focus styling and narrow 16/24/32px gutters. The supplied desktop and mobile references guide the left-form/right-panel desktop arrangement, single-column mobile order, muted borders, red controls, soft panel background and gold outline icons. The current approved font direction is retained: Chakra Petch for English and Bela Bereka for Amharic, with normal Ethiopic letter spacing and language-specific sizing and line heights.

The page has Home / Feedback breadcrumbs, “We welcome your feedback.”, a short invitation to share questions, suggestions or corrections, visible field labels and a supporting panel. The panel covers questions about a teaching, suggestions for new topics and website issues/corrections, links to `/teachings`, and links to the existing `https://t.me/orthodox_chrstianity` channel. No contact details or response times were invented. Amharic copy is draft for client review.

The user's preview behavior overrides the references' Send feedback button and private-delivery claim. Above the fields the page says “Preview only — messages are not sent or saved.” The button says “Check feedback (preview)”. Valid input displays only “Your feedback is ready. Sending will be available when the website launches.” It never claims a message was sent.

## Form behavior

- Name is optional, with `autocomplete="name"`, a 100-character HTML limit and a matching validation guard.
- Email is optional, with `type="email"`, `autocomplete="email"` and format validation when supplied. Helper text explains that a reply requires an email once sending becomes available.
- Message is required, with a 5,000-character HTML limit and a matching validation guard. Empty messages and messages containing only whitespace are rejected. The character limits follow JavaScript/HTML string length (UTF-16 code units).
- Validation prevents the normal form submission, preserves every entered value, marks invalid fields with `aria-invalid`, connects helpers/errors through `aria-describedby`, announces an error summary and focuses the first invalid field.
- The success preview uses a persistent polite, atomic status region. Editing a field clears its previous error and dismisses a stale ready status until it is checked again.
- Values and validation codes live only in component state. Switching dictionaries translates labels, errors and status without replacing user text. Form inputs use the shared Latin/Ethiopic fallback stack so either script can be entered in either interface.
- No fetch, server action, submission endpoint, browser storage, URL payload, logging or email action is used for form contents. Field values are not cleared by a successful check; they disappear when the page component is left/reloaded. The existing interface-language preference remains the only application storage write. Browser-managed autocomplete is independent of application storage.

## Verification

`npm run build`, `npm run typecheck` and `npm run lint` passed. The React review covered controlled state, translated error codes, stable component identity on language changes, accessible labels/status, form-first DOM order and the absence of side effects for submission.

`node scripts/feedback-review.cjs` checks the real validation helper and runs eight browser cases: English and Amharic at 1536px, 1024px, 390px and 320px.

- Validation helper checks: optional name/email, accepted 100/5,000 limits, rejected 101/5,001 lengths, empty/ASCII/Unicode whitespace messages and malformed emails.
- Browser checks: blank message, invalid email, whitespace-only message, translated inline errors, matching descriptions, error-summary content and first-invalid-field focus. A message with no name or email passes in both languages and keeps its text.
- Mixed English/Amharic user text and surrounding spaces remain unchanged through language switching. Existing errors translate. Editing after a valid check clears the stale status; checking again restores it.
- Keyboard Tab order through name, email, message and check button is correct. Enter runs the check. Focus has the shared visible 3px solid outline. The mobile menu opens, stays overflow-free and closes with Escape.
- Desktop form/panel ordering, mobile form-before-panel ordering and the shared gutter values were measured. No horizontal document overflow in pristine, invalid, valid or open-menu states.
- Browse the library was clicked successfully in both languages at every checked width. Telegram's rendered destination was checked against the configured existing channel.
- Request monitoring found zero requests during preview checks and language switching. Instrumented fetch, XMLHttpRequest, beacon and Storage writes found no form-content operations; only `oat-interface-language` changed. Session storage remained empty. Returning to Feedback showed empty fields.
- No JavaScript page errors. Desktop and 390px pristine screenshots in both languages and the English validation-error screenshot were visually inspected.

Evidence: [browser report](previews/feedback-browser-check.json). The capture script uses the bundled Playwright package and installed Chrome against the running local development server on port 3000. Screenshots hide the Next development indicator only during capture.

| Language | Desktop, 1536px | Mobile, 390px | Validation errors, 390px |
| --- | --- | --- | --- |
| English | [Desktop](previews/phase-2-feedback-en-1536.png) | [Mobile](previews/phase-2-feedback-en-390.png) | [Errors](previews/phase-2-feedback-errors-en.png) |
| Amharic | [Desktop](previews/phase-2-feedback-am-1536.png) | [Mobile](previews/phase-2-feedback-am-390.png) | [Errors](previews/phase-2-feedback-errors-am.png) |

## What remains for real submission

Before replacing this preview with real submission, implement an approved server endpoint with server-side validation and abuse/rate controls; decide how feedback is stored or delivered, who can read it and how long it is retained; agree on privacy wording and the reply workflow; and add accessible pending, failure/retry and confirmed-success states backed by actual submission results. Approve both languages and test the full delivery flow before launch. None of those capabilities is present in this phase.

## Testing limits

Tests used desktop Chrome with emulated viewport sizes, not physical touch devices or other engines. Screen-reader associations/live-region markup and keyboard focus were checked programmatically; actual spoken announcements were not tested with assistive technology. Browser autocomplete behavior was not tested. The external Telegram channel was not opened or modified. No real submission, delivery, backend security or persistence workflow exists to test. Final layout and Amharic wording await visual/native-language review.
