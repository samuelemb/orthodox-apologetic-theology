# Phase 6A — Pre-launch review

Reviewed 2026-10-19. **Review only; no deployment.** The local integrated journeys passed, but launch approval remains pending the checklist below. No application defects required a fix, and no redesign/features were added. The temporary review server is stopped.

## Results

| Status | Item | Evidence / limit |
| --- | --- | --- |
| **Passed** | Owner signs in, creates a teaching, saves/reloads a draft, previews and publishes English | Actual browser/editor/server-action/database journey with a temporary owner |
| **Passed** | Signed-out visitor finds the teaching through Library and opens it | Published article text rendered; draft URL had returned 404 |
| **Passed** | Publish Amharic, retain one teaching card, switch articles by version slug | Actual owner UI and signed-out public UI |
| **Passed** | Unpublish Amharic and remove its public access/switch | Subsequent direct request returned 404; switch disappeared; only the test version was republished for screen review |
| **Passed** | Visitor sends feedback; owner sees unread, marks read and refreshes | Actual submission and private inbox; persisted read status |
| **Passed** | Five public page types and main admin screens at 1440/390 px, English/Amharic | 44 screen cases: Home, Library, Details, About, Feedback; owner Overview, teaching list, editor, saved preview, inbox; plus login. No horizontal overflow or browser JS errors in tested flows |
| **Passed** | Keyboard/navigation review | Visible keyboard focus, mobile menu open/Escape/focus return, article anchors, 18 distinct internal links returned successful responses; Telegram link returned HTTP 200 (channel identity still needs client confirmation) |
| **Passed** | Requested editor UX | Inactive-language field errors activate/focus the invalid field, mark the tab, and clear after correction; section/paragraph dialogs use Cancel first, focus trapping, Escape and selective removal; Amharic dialog fits mobile; zero native confirm popups |
| **Passed** | Empty states | Genuine Home/Library empty states and missing article before test publication; admin no-search-results and Unread inbox empty state. Full empty admin-teaching list was not recreated because an existing teaching must be preserved |
| **Passed** | Migrations and local configuration inventory | All six local migrations applied; no pending/unexpected remote migrations; public sign-ups disabled; required local variable names present |
| **Passed** | Preservation/cleanup | One isolated teaching/two translations and one isolated feedback message removed by exact IDs. Teaching/translation/feedback checksums and original owner memberships unchanged; run-marked temporary owner deleted. Permanent owner retained |
| **Passed** | Final TypeScript, lint and production build | One final pass of each; no unrelated security suite rerun |
| **Untested / unverified** | Actual YouTube playback | One attempt on a temporary verification video did not establish advancing media. Valid controlled iframe URL is a separate passed check. No existing approved published client video is available; do not report playback as passed |
| **Untested** | Deployed origin/Auth/proxy/CDN behavior, physical phones, other engines, screen reader | Requires later staging/deployed URL or device/manual testing; no deployment authorized |
| **Untested** | Actual backup/export and restore rehearsal | Procedure and installed CLI flags reviewed only; no backup/restore or production account recovery was performed |
| **Failed** | Executed local functional checks | None. Outstanding launch gates and unverified playback remain unresolved, not silently counted as passes |

Evidence: `verification/phase-6-review-tests.json` (10 passed groups, one unverified playback item, 44 matrix cases), `verification/phase-6-inventory.json`, and `verification/phase-6-backup-command-review.json`. Runner: `scripts/hosted/prelaunch-review.mjs`. Review reused the prior production build before the final unchanged-application rebuild. Four screenshots were captured once and visually inspected: [Home desktop](previews/phase-6-home-desktop.png), [Editor desktop](previews/phase-6-editor-desktop.png), [Article/mobile Amharic interface](previews/phase-6-article-mobile.png), [Amharic removal dialog/mobile](previews/phase-6-dialog-mobile.png). All contain temporary content, now removed. No credentials or permanent-owner identity are shown.

Prior evidence reused rather than rerunning unrelated suites: Phase 4A authentication/RLS handoff; `editor-ux-focused-tests.json` for duplicate slug/error correction/reordering; `navigation-ux-focused-tests.json` for styled leave warnings and native reload protection; `phase-5-public-tests.json` for owner-session draft privacy, search/pagination/history and outage states; `phase-5b-feedback-tests.json` for field/body/origin/honeypot rejection, private data denial and shared two-instance rate limiting. Those remain historical passes, not additional Phase 6 executions.

## Interface and content findings

- **Client approval needed:** baseline is one existing teaching, zero published versions and zero feedback. After cleanup the public teaching pages correctly return to empty. This is a content-readiness gate: review and deliberately publish client-approved material; this review did not publish existing drafts.
- **Client approval needed:** About still says the library is being prepared / will offer teachings (with equivalent Amharic wording). Review the ministry description, theological terminology, both interface languages, branding/fonts, Telegram destination and initial article translations. This copy was identified, not rewritten without client approval.
- **Intentional placeholder:** a saved video section with no approved YouTube ID renders a localized video placeholder with pending/playback-unverified copy. The application permits this for drafts/publications. Supply approved working IDs or remove such sections before publishing client articles. This review added a test-only video, never to existing content.
- Home/Library/Details no longer display the obsolete sample notices, and Feedback no longer displays preview-only submission copy. Owner-only preview labels and publication/draft/unsaved warnings are intentional operational text. Old sample/coming-next strings remain in unused dictionary/fixture files; they were not seen in the reviewed live screens. The generic `placeholder-page` CSS class also styles missing articles and is not itself displayed placeholder content.
- No broken internal link was found in the 18 checked destinations. HTTP 200 from Telegram does not establish the client's ownership or approval. External YouTube availability and actual client-video playback remain unresolved.
- No small application fix was necessary. The review added only its test/evidence/documentation artifacts. Substantial readiness concerns below are reported rather than expanded into new features.

## Launch checklist — not performed by this review

### Configuration and production validation

- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the intended project. They are public; do not put an administrative key in either.
- [ ] Set **one** private server credential, `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`, for feedback submission. Keep it outside source/browser bundles/logs. The application uses it only for the narrow insert-and-limit RPC.
- [ ] Set `FEEDBACK_ALLOWED_ORIGINS` to reviewed exact production HTTPS origins, comma-separated without trailing slashes. Decide canonical host/aliases; do not copy loopback origins or add wildcards to production.
- [ ] Configure Supabase Auth Site URL to the canonical HTTPS website, with only deliberately required redirect URLs. Keep public sign-ups, anonymous sign-ins and unused providers disabled. No self-service password-reset/callback flow exists; do not advertise one. Supabase documents [redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls).
- [ ] On the eventual staging URL, check secure session cookies, owner sign-in/refresh/sign-out, private no-store responses, public anonymous reads even with owner cookies, admin status-change Origin/Host/protocol handling behind the real proxy, feedback trusted origins, and published/unpublished freshness. Confirm no test fetch shim/NODE_OPTIONS is present.
- [ ] Verify target migration history before applying anything: development currently has `20261010000100`, `20261010000200`, `20261014000100`, `20261014000200`, `20261014000300`, `20261016000100`; **none unapplied here**. A different production project must be inspected separately; use migrations, never test scripts or sample seeds to initialize it.

### Owner handover and recovery

- [ ] Client receives control of the intended Supabase/hosting accounts and secure custody of recovery methods/credentials. Preserve this development owner; do not transfer its password to production.
- [ ] A trusted administrator creates the verified client Auth account without invitation emails, lets the client enter a password privately, verifies the exact Auth UUID, then inserts only that UUID into `private.owner_allowlist` through trusted SQL. The development provisioning script deliberately refuses another project/an already-provisioned owner; it is not a production handover script.
- [ ] Client demonstrates login, refresh, editing/preview, publishing, inbox and sign-out. Review any production development/test memberships only after client ownership is proven. Never bulk-delete accounts or infer allowlist access from editable metadata.
- [ ] Document the trusted administrator and identity-verification process for loss of access. Currently recovery is out-of-band: after verifying the rightful owner/project/UUID, the administrator uses Supabase Auth management or server-only `auth.admin.updateUserById` to set a privately entered replacement password, verifies/reinstates that same UUID's allowlist membership, reviews/revokes old sessions, and checks login. Do not place a new password in a CLI argument, file, chat or browser bundle. No recovery email was sent or recovery executed here. The administrative password operation is documented by [Supabase](https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid).

### Backup/export and restore procedure

- [ ] Assign a backup owner, off-site encrypted storage, retention and restore-test schedule. Archive source, lockfile, migrations and static assets separately; retain server/Auth settings in secure custody. Database backups are not a complete website/configuration backup; plan availability must be checked. See [Supabase backups](https://supabase.com/docs/guides/platform/backups).
- [ ] With installed CLI/Docker and privately configured trusted credentials, verify the linked source target and export outside the repository:

```powershell
supabase db dump --linked --role-only --file roles.sql
supabase db dump --linked --file schema.sql
supabase db dump --linked --data-only --use-copy --file data.sql
supabase db dump --linked --schema supabase_migrations --file history-schema.sql
supabase db dump --linked --schema supabase_migrations --data-only --use-copy --file history-data.sql
```

- [ ] Inspect exports securely for application/private schema, owner allowlist, Auth users/identities and migration history; protect feedback and password hashes. Restore only into a disposable matching target using the official roles/schema/data single-transaction `psql` procedure (`ON_ERROR_STOP=1`, replica mode for data), then restore history. Use a protected connection/service configuration, never passwords in shell arguments. Check UUID/FK continuity, RLS/grants, owner login, published visibility and feedback after restoring; confirm original target untouched. Follow [Supabase's current restore procedure](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore), including any encryption-key requirements. These commands/procedure were reviewed, **not executed**.

### Remaining acceptance gates

- [ ] Approve and publish actual client content and video IDs; review English/Amharic copy and the About future-tense notice.
- [ ] Verify actual video playback and fullscreen with approved videos on staging and physical phones; check network restrictions, provider consent/bot challenges and browser differences. URL validation is insufficient.
- [ ] Test iOS Safari/Android Chrome, touch zoom/keyboard, screen-reader labels/dialog behavior, and the real production link/origin configuration.
- [ ] Accept or separately address the documented global feedback allowance (20 accepted messages per 10 minutes shared by all visitors), its exhaustion/DoS limitation and possible duplicates after an uncertain response. No CAPTCHA/per-IP service or retry-idempotency feature was added.
- [ ] Accept the published catalog's batched metadata/browser-filtering scale limit, current handled database-error pages' normal HTTP status, and snapshot-until-new-request behavior. Assess these against expected traffic without initiating a redesign here.
- [ ] Complete the disposable restore rehearsal and owner recovery handover before claiming launch readiness. Local pgTAP, broader security/browser engines, performance/load and deployed multi-region checks remain unrun; prior hosted focused evidence is not a substitute for them.

**Stop here for client review. No deployment, production provisioning, backup export, restore, notification or email delivery was performed.**
