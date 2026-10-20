# Phase 5B — Public feedback submission

Implemented 2026-10-16. The existing public Feedback form submits to `POST /api/feedback`, and confirmed messages appear as unread in the existing private owner inbox. Fonts, layout, bilingual controls and teaching features are preserved. No email delivery, reply UI, notification, attachment, comment system or deployment is added.

## Required configuration

Existing Supabase public URL/publishable key remain required. Add one server-only privileged credential (`SUPABASE_SECRET_KEY`, or the legacy `SUPABASE_SERVICE_ROLE_KEY`) in ignored `.env.local` or a deployment's private environment. Never use a NEXT_PUBLIC_ prefix or put it in browser code. The linked development project's existing trusted CLI was used to configure the local key without printing its value. `.env.example` contains names/instructions only.

`FEEDBACK_ALLOWED_ORIGINS` is a comma-separated list of exact browser origins without trailing slashes. Local verification configured `http://127.0.0.1:3000,http://127.0.0.1:3001`. Before any future deployment, deliberately configure the intended HTTPS origins and private key; no deployment was performed. HTTPS is required except for loopback HTTP. The handler does not derive trusted origins from Host, forwarded headers, user fields or Referer. Missing/invalid configuration fails closed. Origin is a cross-site browser control, not proof a caller is human; scripts can forge it.

Apply `supabase/migrations/20261016000100_public_feedback_submission.sql` after the existing migrations. It adds a private singleton rate-budget table and `public.submit_public_feedback(text,text,text)`. It makes no change to existing messages, owner membership or teaching content. The migration was dry-run reviewed and applied to the existing verified development target. Public schema types were regenerated. Evidence: `verification/phase-5b-migration-preview.json` and `verification/phase-5b-migration-applied.json`.

## Submission and privacy

The endpoint accepts only optional name/email, required message, and the website honeypot. Caller-supplied IDs, status, timestamps and other fields are rejected. Names and emails are trimmed, messages have CRLF/CR normalized to LF and surrounding whitespace trimmed. Empty optional strings become SQL NULL. The existing validator enforces a 100 UTF-16-unit name limit, nonblank message of at most 5,000 UTF-16 units, and the existing basic email syntax check. The same normalization is used for browser validation without rewriting retained inputs on failure.

Only JSON is accepted. Content-Length is checked and the actual streamed request body is bounded to 32 KiB, including chunked bodies. Malformed JSON/UTF-8, wrong types, arrays, unexpected fields, blank messages, supplied invalid emails and oversized requests are rejected before any database insert. These limits apply after normalization for field validation; the raw byte cap always applies first.

`src/lib/submit-feedback-server.ts` is marked server-only. It constructs an independent credentialed client with no browser cookies, persisted session or auth storage. Its sole operation is the narrow submission RPC, not table SELECT/INSERT or arbitrary administrative calls. No raw Supabase error, record ID, submitted content, credential or token is returned/logged. The success response is only `{ok:true}`, and only after the database function confirms its transaction. Application error paths return generic errors or field error codes. Responses are no-store.

The function is SECURITY DEFINER with an empty search path and fully qualified table/helper references. Only service_role has EXECUTE; public/anon/authenticated execution is revoked. Direct anonymous insertion remains blocked. Direct service-role table INSERT is also revoked, reserving the application's submission path to the rate-limited function. Existing owner-session inbox reads/updates continue through `requireOwner()` and RLS. The private budget table has RLS enabled and no application grants/policies.

The function revalidates fields, locks the budget row, inserts only name/email/message plus fixed unread status, and lets the database generate the ID/time. The budget increment and insert commit atomically. An insert failure rolls back both. A limited request inserts nothing. Browser responses never contain feedback records; the authenticated owner inbox remains the only application read UI.

## Anti-spam behavior

The offscreen website honeypot is excluded from keyboard focus and the accessibility tree. A nonempty value is rejected with a generic 400 response, without claiming success or calling the database.

The shared database budget allows 20 accepted submissions per 10-minute fixed window across the entire site. Its row lock makes concurrent requests from different application instances share the same allowance. The window resets lazily on the first accepted attempt after expiry. Rejected validation/honeypot requests consume no message allowance; a confirmed insert increments it exactly once. HTTP 429 includes `Retry-After: 600`, a conservative retry delay. No paid service, process-local limiter, raw IP storage or trust in forwarded IP headers is required.

This is intentionally basic protection. The allowance is global: a determined sender can exhaust it for everyone until the window resets. Fixed windows allow bursts around a reset. The honeypot does not stop a sender that omits it. Invalid-request floods can still consume application resources. There is no CAPTCHA, account requirement, per-IP discrimination, queue or automatic retry. Future stronger protection should be designed for the actual deployment and privacy requirements.

## Form behavior

The form displays accessible localized field errors, pending status, success, rate-limit, size and generic-failure messages. Inputs and submit are disabled while pending, and a synchronous ref also blocks repeated/programmatic submissions. Interface-language switching retains state and does not submit or reset the form. A successful confirmed insert clears values; all failures preserve them. The first invalid field or failure message receives focus, with field/error associations and live roles. The honeypot is not a keyboard stop. Preview-only notices and the old check-feedback button/ready state were replaced; inbox notice copy now describes live private submissions.

A network timeout can occur after a database commit but before the browser receives confirmation. In that case the UI deliberately reports that sending could not be confirmed and retains text. There is no automatic retry or idempotency token; manually retrying an uncertain request can create a duplicate message. Text is held in memory only and is lost on a deliberate reload/tab close.

## Executed verification

Evidence: `verification/phase-5b-feedback-tests.json`; runner: `scripts/hosted/feedback-submission-test.mjs`. Six groups passed against the production build and existing hosted development database:

1. Message-only submission using keyboard Tab/Enter; real database confirmation; disabled pending input/button and programmatic-repeat guard; text retained through interface-language switching while pending; success clears only after the confirmed response. The inserted row had NULL name/email and unread status.
2. Optional name/email normalization, newline normalization and trimmed stored text; fixed success response with no record data; confirmed unread message opened in the protected owner inbox with full content.
3. Accessible client errors/focus; server rejection of blank message, invalid email, name over 100 units, message over 5,000 units, unknown status/timestamp fields, wrong message type, malformed JSON, missing/untrusted Origin, and filled honeypot. Oversized regular and streamed bodies returned 413. Rejections changed neither feedback rows nor the rate counter.
4. Simulated server-to-database insert failure returned generic failure, retained text and did not claim success or insert a message; English/Amharic state retention and no horizontal overflow at 390 pixels were checked. A credential-free mobile failure-state capture was visually inspected: `previews/phase-5b-feedback-mobile.png`.
5. Anonymous and authenticated non-owner database reads exposed no feedback; direct table INSERT and direct RPC calls were denied. The GET submission route was unavailable (405). The production browser assets were scanned in memory for the configured privileged test key and contained none. No browser JavaScript errors occurred.
6. Two separate production server processes at ports 3000 and 3001 competed for one remaining database allowance. Exactly one insert returned 201 and the other returned 429 with Retry-After. The rate-limit UI retained entered text. This tests shared persistence and concurrency across processes, not an actual deployed multi-region environment.

TypeScript, lint and production build passed. Lint was repeated only after adding the focused runner. No unrelated suite was repeated. The build identifies `/api/feedback` as dynamic; the form's static page contains no private records or privileged key. No teaching feature was edited or retested in this phase.

For the concurrency boundary, trusted test tooling temporarily set this new rate-budget row to 19 and restored its prior state after checking that no unrelated feedback had appeared. Three isolated messages were accepted (message-only, optional-fields and one concurrent rate-limit winner); failures were not saved. Cleanup discovered only the unique run-prefix messages, deleted those exact UUIDs through the temporary owner's ordinary RLS client, and verified pre-existing feedback checksums. Separate run-marked temporary owner/non-owner Auth identities and only their test membership were removed; the original owner membership list was unchanged. Existing feedback and the permanent owner were preserved. No existing records were deleted or reset.

The temporary production processes used ignored `.tools/feedback-submit-preload.mjs` instrumentation to simulate a failed RPC response, without application test hooks or changes to existing records. That instrumentation is outside browser/application imports, was restored to normal after the check, and is not a deployment artifact. Both local test servers were stopped afterward.

Limits: headless Chrome with desktop/mobile viewport emulation, not physical phones or other engines; no screen-reader, deployed edge/proxy, multi-region, load or sustained bot-attack audit. Failure injection simulated an unavailable insert API rather than an actual database outage. Missing/invalid configuration is handled fail-closed in code but was not separately exercised with a third server configuration. Full previous-phase test suites were intentionally not run. The global allowance and uncertain-network duplicate possibility are described above.

Phase 5B stops here for review. No deployment or email delivery was performed.
