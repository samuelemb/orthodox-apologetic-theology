# Phase 4C — Owner feedback inbox

Completed 2026-10-16. Scope is the private owner inbox only. Public Feedback remains preview-only; no submission, deletion, archive, email reply, notification, deployment or teaching-editor changes were added.

## Implementation

`/admin/feedback` now uses the existing admin shell, approved fonts and theme colors, with English and Amharic interface copy. The desktop two-pane list/detail arrangement follows `AI images/admin/Orthodox Feedback Inbox-4.png`; narrow screens stack the panes. Controls shown in the reference but outside this phase (search, archive, reply) are omitted. The overview now links to the completed inbox.

Messages sort newest first by creation timestamp, with ID as a deterministic tie-breaker. Each list entry shows the provided name or Anonymous, a 160-character excerpt, localized date and explicit read/unread status. All and Unread filters use server queries. Previous/Next pagination returns 20 entries at a time, fetching one extra to determine whether another page exists. Filtering resets to page one. Pagination uses offsets: concurrent additions/status changes can move page boundaries, so refreshing may shift entries.

Opening a message fetches its full plain-text body and optional email, then focuses the detail heading. Opening does not automatically change its status. Mark as read / Mark as unread saves explicitly, refreshes the current list, and retains the open detail so the owner can reverse the change. Status persists in the existing `feedback.status` column. React text rendering escapes submitted markup; message line breaks are preserved. No HTML interpretation, mail links or browser storage persistence is used.

The UI includes initial/loading, no-message/no-unread, list retry, detail retry, pending mutation, saved status and mutation-failure states. Filter requests are aborted when replaced; detail request sequence guards prevent an earlier response replacing a later selection. Status controls disable conflicting selections while saving. Native buttons support keyboard activation, selected filters expose pressed state, messages identify current selection, and status/error text uses live roles. Back to messages restores focus when its original row is still present.

## Security and setup

No migration, new dependency or additional environment setting is required. Existing Phase 3 migrations, configured Supabase public URL/key and owner allowlist provisioning are prerequisites.

The page independently calls `requireOwner()`. Both GET and PATCH at `/admin/feedback-data` also independently call it, verifying the Auth identity and current owner membership before any database access. Every normal query/update uses that verified session's request-scoped Supabase client and existing RLS. No privileged client is imported into application code.

GET provides bounded list pages or a single UUID-selected message. PATCH validates UUID, read/unread status, permitted keys, JSON content type and payload size, and requires a matching browser Origin/Host/protocol. Only status is updated. Missing records return 404; invalid inputs and unauthorized callers fail closed. Responses, including failures, use private/no-store cache headers; the admin proxy and force-dynamic layout remain in effect. No shared identity/data cache is introduced.

## Executed checks

Evidence: `verification/phase-4c-inbox-tests.json`; reproducible focused script: `scripts/hosted/feedback-inbox-test.mjs`.

Six focused Chrome groups passed against the configured hosted development database:

1. Owner list ordering, 20-row pagination and next/previous navigation; keyboard opening; detail-heading focus; anonymous fallback, optional email and full message; literal HTML-looking text rendered without an image element.
2. Mark read, refresh and reopen; Unread exclusion of read records; mark unread, refresh and reopen with persisted unread status.
3. Private/no-store response headers; invalid status rejection, foreign-origin rejection and nonexistent UUID handling.
4. Anonymous and authenticated non-owner list/update denial through both application handlers and direct database RLS; protected page navigation redirects to login.
5. Simulated list failure and retry, delayed loading and empty state; simulated failed status save leaves the database status unchanged.
6. English and Amharic interface use, keyboard navigation to the status button, and 390-pixel mobile viewport with no horizontal overflow.

TypeScript (`npm run typecheck`), lint (`npm run lint`) and production build (`npm run build`) each ran once after implementation and passed. Build reports the inbox page and data handler as dynamic, and public Feedback remains static. Previous-phase suites were not rerun.

The first browser attempt found the website stopped; its fixtures/accounts were cleaned up. The next attempt caught a local internal-hostname mismatch in the Origin check. The handler was corrected to compare the browser Origin with the incoming Host and protocol, and the final focused flow passed. No secret values were logged.

## Cleanup and limits

The final run created 22 isolated feedback records and separate temporary owner/non-owner accounts. Cleanup deleted only exact recorded fixture IDs and accounts verified by run-specific metadata. The report confirms that all pre-existing feedback rows remained byte-for-byte unchanged and the original owner memberships were restored. The permanent owner was retained. No teaching record was changed.

Desktop English and mobile Amharic captures containing only test messages were visually inspected: `previews/phase-4c-inbox-desktop.png` and `previews/phase-4c-inbox-mobile.png`. These are full-page captures, so the mobile detail follows the list. Browser tests used headless desktop Chrome with viewport emulation, not a physical phone or other browser engines. No screen-reader audit, concurrent-owner stress test, production-hosted deployment check or complete previous-phase regression suite was performed. Empty/loading/network states were simulated; real records were used for persistence and authorization checks.

The temporary development server was stopped after verification. Stop here for owner review.
