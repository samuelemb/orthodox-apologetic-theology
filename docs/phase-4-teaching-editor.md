# Phase 4B — Teaching management and editor

Implemented on 2026-10-14 against the existing verified development project. Phase 3 RLS and Phase 4A owner authentication remain in use. Public pages still render the same six sample teachings/twelve language versions; Feedback remains a local-validation preview. No deployment, feedback inbox operations, live public content, public submission, registration, comments, audio/media uploads or teaching deletion UI was added.

## Owner workflow

`/admin/teachings` reads actual Supabase teachings and language versions through the signed-in owner's session. Each teaching appears once, with its topic and separate English/Amharic draft, published or not-added indicators. Search matches either version's title; topic filtering and displayed counts use real records. Loading, empty, no-results and retryable read-error states are provided. Reads use keyset batches of 200 teachings, avoiding the Data API's default row limit; the loaded records are filtered in the browser. Interface language determines the preferred display title without changing content.

Create teaching opens `/admin/teachings/new`. Start with English, Amharic or both; Add translation adds the missing version under the same teaching ID. No translation or text is generated. Language tabs, including arrow/Home/End keyboard behavior, change the version being edited independently of the interface language. Entered content stays in memory across both kinds of language switching and inline preview. New records are inserted only on successful save, so abandoning an unsaved editor does not leave an empty teaching in the database.

Each version has title, excerpt, explicitly entered slug, article blocks and optional YouTube input. The section editor handles headings, individual paragraph blocks and an optional video block. It can add, edit, remove and reorder sections and add/remove paragraphs, without exposing raw JSON or rich HTML. IDs remain stable when sections move. English tabs precede Amharic tabs; initial selection prefers the current interface language when available. The approved root fonts, palette, public layouts and admin authentication shell are retained. Draft Amharic interface copy still needs client review.

All versions included in a save must be complete enough to satisfy the existing schema, even when saving drafts. Limits are title/heading/video title 300 characters, excerpt 2,000, slug 160, paragraph 10,000; 1–100 sections, up to 200 nonempty paragraphs per section, at most one video section, and a save payload under 900,000 UTF-8 bytes. Topic and language are validated against their existing allowed values. Slugs use lowercase Latin letters/numbers with internal hyphens and are globally unique across versions. Title edits never regenerate slugs; duplicate slugs get an actionable error, with all entered text retained.

## Saving, preview and publication

New versions always save as drafts. Save changes writes all present language tabs atomically. Publication is a separate action enabled after the selected version has been saved and the editor has no unsaved changes. Publish/unpublish affects only that language version; another version can stay draft or published. The database controls status and publication timestamps, ignoring editable browser status flags.

**Saving edits to an already published version updates that published version immediately**, retaining its publication status/date. Unpublish it before editing if changes must remain private. This behavior is explained in the editor. Publication currently changes database visibility under existing RLS; the public website remains on sample data until Phase 5.

Inline owner preview validates the selected version and renders its current, possibly unsaved content without saving or publishing. Saved preview at `/admin/teachings/[id]/preview?language=en|am` reads the saved version after server owner verification. Both use `ArticleBody`, extracted from the existing public article renderer; public text/video rendering behavior is unchanged. Content language, headings, plain React text, and the controlled video embed are shared. Saved previews are private and uncached. A saved-preview link opens a separate tab so an owner can compare retained edits against the saved record after a conflict or uncertain save.

Progress disables editor fields/actions and sets `aria-busy`; completion uses a live status, and actionable errors receive focus and `role=alert`. Failures retain all editor text. App links and sign-out warn before discarding unsaved changes; browser Back uses a same-URL history guard, and refresh/closing/full navigation uses the native before-unload warning. Language switches and opening a separate saved-preview tab do not discard text. This is an in-memory editor, not persistent browser draft storage: deliberately confirming a discard or closing the tab loses unsaved text.

## YouTube

The server accepts an 11-character video ID, HTTPS `youtu.be/ID`, or supported `youtube.com`, `www.youtube.com`, `m.youtube.com` watch, shorts, embed or live URLs. It rejects other origins, non-HTTPS URLs, credentials, nonstandard ports, malformed IDs and iframe HTML. It normalizes accepted input to the stored ID. A video ID requires one titled video section, which determines its position. Without an ID a video section shows the existing renderer's placeholder.

Preview constructs only `https://www.youtube-nocookie.com/embed/VALIDATED_ID`. Arbitrary iframe HTML and URLs never enter the article document. Verification checked normalization and iframe source, not video availability/playback or third-party YouTube behavior.

## Transactions, retries and security

Every protected page/read and the save server action calls the existing `requireOwner()`, which verifies Auth identity and protected `is_owner()` membership. Normal reads, saves, publication and test content operations use publishable-key clients with the caller's session and RLS. No privileged key is used by application/browser code. Invalid configuration, identity, membership, database errors or missing records never render protected data or authorize a save. Private admin routes remain dynamic and carry the existing private/no-store proxy headers. Save success invalidates affected list/editor/preview route caches, including prefetched list data.

The atomic save RPC is `SECURITY INVOKER`, explicitly verifies `is_owner()` and retains all existing table constraints/RLS. An advisory transaction lock serializes saves for a stable teaching ID. An owner-only `teaching_edit_state` table tracks revision and the last save request ID/payload hash; its rows cascade with the teaching. Anonymous callers have no grants; non-owner sessions see no rows and cannot modify state. The allowlist remains protected as before.

A stable UUID request ID is retained for an unchanged retry. Repeating a committed request with the same payload returns the saved snapshot without creating duplicate teachings/versions or incrementing revision again. Reusing the same request ID with different content is rejected. Changed input gets a new request ID. Expected revisions detect another session's edits and return an actionable HTTP 409 conflict; stale text remains in the editor rather than overwriting the saved content. The last request is retained per teaching; a delayed retry after a later save is rejected as stale, not reapplied. An uncertain save should first be retried unchanged. After a conflict, open the saved preview, compare/copy edits, then deliberately reload before saving.

Teaching metadata, translations and revision state commit together. Invalid second versions, duplicate slugs or constraint failures roll back the entire save, including topic/timestamp changes. A unique `(teaching_id, language)` constraint plus RPC validation prevents duplicate language versions. Omitted existing versions are retained; this phase offers no translation/teaching deletion. Editor database requests have a 20-second timeout; unknown outcomes receive the retry-safe error rather than an indefinite saving state.

## Setup and migrations

No new dependency or environment key is required. Existing `.env.local` contains only the reviewed project URL and publishable key. Apply the following versioned migrations after the two Phase 3 migrations, in order:

1. `20261014000100_atomic_teaching_editor.sql`: owner-only coordination table and invoker read/save RPCs.
2. `20261014000200_editor_conflict_response.sql`: expected edit conflicts return `PT409`/HTTP 409 rather than `40001`, which can trigger PostgREST transaction retries.
3. `20261014000300_video_article_validation.sql`: fixes JSON operator grouping in the existing article validator, without changing the document contract or relaxing allowed keys.

All three were previewed and applied to the already linked development project using trusted existing CLI tooling, with no seeds, reset or deletion of existing content. Migration history is preserved. Both editor RPCs are verified as invoker functions. Public schema TypeScript types were regenerated from the hosted schema. Migration evidence is in `verification/phase-4b-migration-preview.json`, `phase-4b-migration-applied.json`, `phase-4b-conflict-migration.json`, and `phase-4b-video-validator-migration.json`.

Verification found two database issues and fixed them before delivery: the initial stale-edit error code could cause PostgREST retries, and the existing SQL validator rejected valid video sections because `(section->'video' - 'title')` needed `((section->'video') - 'title')`. The validator's catch turned the operator error into `false`. Focused SQL checks now accept a valid video and still reject extra iframe keys, multiple videos and empty paragraphs. Existing RLS policies and the permanent owner were retained.

## Exact verification

Build, strict TypeScript, lint, focused field/YouTube validation and application foundation checks passed. Production browser/data tests used loopback port 3003 with real sessions and ordinary RLS clients. Separate run-marked temporary owner/non-owner accounts and isolated teachings were created; privileged tooling was limited to Auth-admin fixture setup/cleanup, trusted test membership SQL, migrations and read-only inspection. No invitation emails or sample seeds were sent/loaded, and no permanent-owner password was used by tests.

The main and focused suites completed these 12 groups; the consolidated record identifies both source runs rather than claiming every check passed in a single initial run:

| Check | Result |
| --- | --- |
| Empty real list; create/reload an English draft through actual editor | Passed, fields persisted |
| Add Amharic to same ID; content/interface tab switches retain text | Passed, exactly two versions |
| Duplicate slug through UI | Actionable error, original slug retained, save rolled back |
| Section add/edit/reorder/remove; paragraph add/remove; title edit | Passed; slug unchanged |
| Anonymous draft reads; publish/unpublish each language | Drafts hidden; English and Amharic visibility changed independently |
| Edit a published version | Anonymous database read saw the saved edit immediately; status retained |
| Inline and saved private preview; bilingual desktop/mobile keyboard | Shared renderer, correct content language and no-store saved response; no overflow at 1536/390/320 |
| Simulated failed save, retry, app-link and browser-Back warning cancellation | Text retained; retry persisted; cancelled navigation stayed in editor |
| Amharic-only teaching; invalid second version/duplicate-slug rollback | Single version persisted; failed multi-record writes made no partial changes |
| Committed create/update retry and changed retry payload | No duplicate records/revision increment; changed payload rejected |
| Stale revision and stale UI save | HTTP 409/actionable error; saved content not overwritten; typed text retained |
| Video input, invalid required content, fixed embed, real grouped list/search | Valid input normalized; spoofed origin/empty title rejected; one row per teaching |
| Anonymous/non-owner page, RPC and replayed server-action requests | Protected list/new/edit/preview denied; reads/mutations denied; revision unchanged |

The consolidated evidence is `verification/phase-4b-editor-tests.json` (12 named groups, several assertions each). The original video failure/cleanup is preserved in `phase-4b-editor-before-video-fix.json`, and successful remaining checks are in `phase-4b-editor-remaining-tests.json`.

Final-build UI checks additionally verified starting with both languages, Home/End/arrow tab behavior, disabled pending fields/button and progress text, preservation of both tabs after a forced failure, native refresh warning/cancellation, both versions saving as drafts, and in-app navigation showing newly saved records after prefetch invalidation. Evidence: `verification/phase-4b-final-ui-tests.json`. Final screenshots also show an Amharic-only entry's English not-added state.

Public regressions passed 24 Library layout cases, 24 article checks, six/twelve sample identity/functionality checks, and eight Feedback browser cases plus validation boundaries. Public regression scripts targeted the production server through ignored port-adjusted execution copies. The extraction of `ArticleBody` preserved public article text, placeholders, links and language behavior; no public Supabase reads/submission were enabled.

Cleanup checked exact fixture IDs and account run markers, deleted isolated teachings through the temporary owner's RLS client, removed only temporary memberships/accounts, and compared existing teaching/translation checksums and permanent-owner memberships against the pre-run baseline. Test state cascaded away. Existing content and the permanent owner were preserved. Recovery journals contain only fixture/run/account IDs, never passwords or JWTs, under ignored `.tools/supabase/`.

Some capture attempts encountered transient read/cleanup timeouts. One attempt required trusted recovery after ordinary test-record cleanup timed out: it checked exact journal IDs and matching run-specific translation slugs before deleting those two isolated records. Evidence: `verification/phase-4b-cleanup-recovery.json`. The subsequent final UI run and its ordinary cleanup passed. `verification/phase-4b-final-integrity.json` independently records final counts, retained permanent-owner membership, invoker functions and migration history. Test navigation assertions were scoped to the actual list rows after route completion, avoiding matching the editor's diagnostic teaching-ID attribute during transition.

To repeat against the reviewed development target with the production server at 3003:

```powershell
npm run test:teaching-validation
npm run test:teaching-editor
npm run test:teaching-editor-ui
```

The hosted runners require the existing authenticated trusted CLI only for temporary setup/cleanup and intentionally verify the linked development target. Keep credentials out of chat/logs. The scoped remaining-check runner can use the private local environment flag `PHASE4B_REMAINING_ONLY=1`; leave it unset for a complete run.

Limitations: desktop Chrome viewport emulation rather than physical mobile devices/other engines; no screen-reader audit; no playback verification; loading/list-read-error presentations are implemented but not separately fault-injected. Local pgTAP remains unrun because Docker is unavailable; these are separate hosted real-session tests. The UI is a plain-text section editor, not a formatting toolbar, autosave system or translation service. Conflict resolution is deliberate comparison/reload, not automatic merging.

## Credential-free final screenshots

Screens show isolated test content, which was removed after capture. No credentials or account identity are visible.

| View | English | Amharic |
| --- | --- | --- |
| Real grouped list | [Desktop](previews/phase-4b-list-en-1536.png) / [Mobile](previews/phase-4b-list-en-390.png) | [Desktop](previews/phase-4b-list-am-1536.png) / [Mobile](previews/phase-4b-list-am-390.png) |
| Editor | [Desktop](previews/phase-4b-editor-en-1536.png) / [Mobile](previews/phase-4b-editor-en-390.png) | [Desktop](previews/phase-4b-editor-am-1536.png) / [Mobile](previews/phase-4b-editor-am-390.png) |
| Shared-renderer preview | [Desktop](previews/phase-4b-preview-en-1536.png) / [Mobile](previews/phase-4b-preview-en-390.png) | [Desktop](previews/phase-4b-preview-am-1536.png) / [Mobile](previews/phase-4b-preview-am-390.png) |

Official references: [Supabase database functions and invoker security](https://supabase.com/docs/guides/database/functions), [PostgREST expected conflict handling](https://supabase.com/docs/guides/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b), [Next.js route invalidation](https://nextjs.org/docs/app/api-reference/functions/revalidatePath).

Phase 4B stops here for review. The feedback inbox and Phase 5 public database connection remain deferred.

## Focused editor UX improvements — 2026-10-16

Input failures now appear beside their fields and in a short linked summary. Summary links select the correct content-language tab, scroll to the field and focus it; the first invalid field receives focus after a failed submission. Tabs with errors are marked. Diagnostics use stable section IDs, with section numbers and paragraph indexes recomputed from the current editor state, so reordering/removal cannot leave stale error links. Corrections update errors without clearing content. Relevant limits appear with the affected field rather than in a generic technical banner. English/Amharic messages are selected independently of content language.

The existing server validator and database constraints remain authoritative. Owner-session slug checks now return affected language/slug field identifiers, including a second check after a uniqueness race. Network, authorization and save-conflict failures remain separate from input diagnostics. The save payload-size limit and all publication/RLS rules are unchanged; no migration was required.

Section and paragraph removal now use a styled modal HTML dialog. Cancel receives initial focus; Tab/Shift+Tab stay inside; Escape or cancellation removes nothing. The dialog identifies the selected section/paragraph and explains that removal is saved only with the teaching. Confirmation removes just that item, retains other content, marks the editor dirty and restores focus to a neighboring field or add control. Existing native close/reload and unsaved-navigation protection remains unchanged.

Focused Chrome checks passed missing-field associations, first-invalid focus, inactive-language errors and tab markers, linked navigation, correction, stable targets after reordering/removal, paragraph error reindexing, real server duplicate-slug mapping, server validation with client checks bypassed, and separate simulated network failure handling. Dialog checks covered Cancel, confirmation, Escape, keyboard trapping/restoration, Amharic wording and fit at 320×640. One temporary mobile dialog capture was inspected; no large screenshot set or full Phase 4B suite was repeated. Evidence: `verification/editor-ux-focused-tests.json`. A separate saved-record check confirmed that removal marks the editor unsaved, focuses Add section when the last section is removed, and leaves stored content intact until Save; evidence: `verification/editor-ux-saved-removal-test.json`. Existing broad-suite removal/error selectors were updated for the new UI, without running that suite.

TypeScript and lint passed. The focused runners used a run-marked temporary owner and an isolated duplicate-slug fixture, cleaned up afterward; the permanent owner and existing teachings were preserved. Review the updated implementation on the separate local development server at port 3004; port 3003 was left running to avoid disrupting an existing editor session. Testing used Chrome rather than a screen-reader audit or physical mobile device.

### Styled unsaved-navigation warning (2026-10-16)

Back to teachings, sidebar links, sign-out and browser Back now use the shared styled confirmation dialog: Stay in editor / Discard changes and leave, localized in English and Amharic. Stay receives initial focus; Tab is trapped, Escape cancels, and cancellation restores focus and preserves entered content. Native browser close/reload warnings remain. This supersedes the earlier note that unsaved-navigation UI was unchanged.

Six focused Chrome checks passed: link cancellation/Escape and focus restoration, sidebar discard, browser Back cancellation/discard, native reload cancellation, Amharic mobile fit at 320x640, and sign-out cancellation/discard. One mobile capture was inspected. TypeScript and lint passed. Evidence: `verification/navigation-ux-focused-tests.json`. The temporary test owner was removed, existing owners/teachings were verified unchanged, and no teaching content was saved. The full Phase 4B suite was not repeated.
