# Phase 4A — Owner authentication and protected admin layout

Implemented on 2026-10-13 against the verified development project `ctewndpjtkcpybclniuf`. A permanent development owner was created by the user through the private terminal procedure; its Auth account and protected allowlist membership were independently verified. This account is separate from automated test identities and remains in place. Its email, password and UUID are not included in this handoff. Personal browser verification is tracked separately in `verification/phase-4-permanent-owner.json`.

## Delivered scope

- `/admin/login`: supplied warm-white/card/logo/red-button design adapted to the approved existing fonts. Email, password, accessible show/hide control, browser autocomplete, keyboard submission, disabled submitting state, and a linked live error message. No registration or password-reset link.
- `/admin`: separate responsive owner shell, language controls, website return link, keyboard skip link, navigation and sign-out.
- `/admin/teachings` and `/admin/feedback`: protected, explicitly marked **Coming next**, with scope descriptions. No teaching editor, feedback inbox operations, counts or fabricated statistics.
- English and draft Amharic UI use the existing language provider and device-local preference. Root font configuration and public components remain unchanged.

Public pages retain six local sample teachings/twelve versions. Feedback remains validation-only. No database-backed public content, real feedback submission or deployment was added. Stop here for review before further Phase 4 work.

## Authorization and sessions

The login server action uses the existing request-scoped Supabase SSR client with the publishable key. After password authentication, `requireOwner()` independently verifies the Auth user with `getUser()` and checks the protected `is_owner()` RPC. A non-owner session is cleared and receives the same error as incorrect credentials. Email/owner membership is not disclosed by the UI. Metadata is not used for authorization.

The protected route-group layout and each protected page call `requireOwner()` on the server. This also covers direct/RSC navigation independently of the visible navigation. Each new protected server action must perform this check itself. Sign-out checks authorization and clears the current session even if access has been revoked; clearing that caller's cookies does not grant database access. Sign-out failures receive a bilingual accessible message.

The existing session proxy refreshes cookies. It is not the owner authorization gate. Errors in configuration/refresh fail closed with a generic 503. Protected identity or membership failures redirect to login, without rendering the workspace. The admin layout is dynamic with revalidation disabled; proxy responses have `private, no-store`, `Expires: 0` and `Pragma: no-cache`. Authentication is never stored in a shared cache. A restored browser Back/Forward Cache page reloads to recheck authorization.

Redirects are an exact server-side allowlist: `/admin`, `/admin/teachings`, `/admin/feedback`. Anything else falls back to `/admin`, including external URLs, protocol-relative URLs, traversal/encoded variants and `/admin/login`. Validation occurs both when reading the query and when processing the submitted hidden field; a manipulated form cannot bypass it.

Normal future database operations must use the signed-in owner's returned `client` from `requireOwner()` so verified RLS remains enforced. No service-role client, allowlist write or privileged key is imported by application/browser code. No schema or RLS migration was needed.

## Permanent development owner provisioning

The Phase 3 documented procedure is retained: trusted Auth-admin user creation, verify the exact Auth UUID, then trusted SQL insertion into `private.owner_allowlist`. Public sign-ups stay disabled. The user enters their own email and password privately; no invitation/confirmation email is sent.

From this project directory, the user ran:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\provision-development-owner.ps1
```

The PowerShell wrapper prompts for email, then masked password and confirmation. It sends JSON over the child process's standard input, never through command arguments or a credential file. It releases its plaintext variables afterward. A minimum 12-character password is required by this helper, in addition to hosted Auth validation.

`scripts/hosted/provision-owner.mjs` validates the exact linked development project and live signup-disabled setting. It refuses provisioning if an owner already exists. The authenticated local CLI obtains an Auth-admin key in process memory; it is not added to `.env.local`. The helper calls `auth.admin.createUser` with `email_confirm:true`, verifies the created UUID with Auth-admin lookup, then inserts only that UUID through the existing trusted SQL tooling. Editable metadata never grants membership. The ignored local `.tools/supabase/permanent-development-owner.json` records only the UUID and purpose, enabling recovery if account creation succeeds but a subsequent provisioning step fails. Do not blindly rerun after a partial failure: inspect that record and Auth, verify the exact UUID, and complete the documented SQL manually if needed. Never delete this account as test cleanup.

The user reported creation success. Independent read-only checks confirmed an existing Auth user, matching allowlist membership, and absence of Phase 3B/4A test markers. After all automated test cleanup, exactly one permanent membership and zero Phase 4 test accounts remained; the app environment contained no privileged key. Evidence: `verification/phase-4-permanent-owner.json`. The user separately confirmed permanent-owner login, refresh persistence, sign-out and subsequent protected-navigation denial through the browser. This personal check is user-reported; automated real-session coverage uses separate temporary identities.

### Client owner later

Provision the client's account deliberately on the reviewed client/production project through trusted Supabase Auth management or an equivalent trusted Auth-admin tool. The development-target helper intentionally refuses another project and is not a production provisioning script. Verify the client owns the exact email address and have them enter their password privately. Use user creation without invitations, verify the exact Auth UUID, then run the Phase 3 allowlist SQL as the trusted administrator. Keep public registration disabled and restrict the project's redirect settings to reviewed application URLs. Never hardcode credentials, give the browser an administrative key, or grant authenticated users access to the allowlist.

Verify the client session, non-owner denial and RLS in staging before launch. Do not copy the development owner's password/account into production. Once client ownership is verified, deliberately remove any development membership on the client project through trusted SQL as part of the later handover. The permanent account on this development project is retained.

## Verification performed

Production build, strict TypeScript, lint and the application foundation suite passed. Foundation tests include mocked config/verified identity/RPC fail-closed cases; they are not a new database-policy test. Phase 3B's real-session RLS verification remains the database handoff.

`node scripts/hosted/admin-auth-test.mjs` tested the actual production server at `http://127.0.0.1:3001`, using the publishable key and real password-signed-in sessions. Privileged access was limited to creating/deleting two marked temporary Auth users and trusted fixture membership SQL. Unique reserved test emails/random passwords stay in memory; the ignored recovery journal records IDs and run marker, not passwords/JWTs. No content or feedback fixtures were created.

| Check | Actual result |
| --- | --- |
| Anonymous direct navigation to `/admin`, `/admin/teachings`, `/admin/feedback` | Redirected to login; no workspace rendered; private no-store response verified |
| Incorrect password/credentials | Generic error, `role=alert`, linked `aria-describedby` |
| Non-owner login | Same generic error; no workspace |
| Valid non-owner session installed independently of login | All three protected pages denied by server |
| Temporary allowlisted owner login | Successful through the actual form/server action |
| Refresh/session persistence | Workspace remained accessible after refresh |
| Protected section navigation | All three implemented routes accessible to owner |
| Sign-out then Back, refresh, direct `/admin` | Workspace absent; direct navigation redirected to login |
| External/protocol-relative/traversal/encoded/login redirect targets | Fallback `/admin`; repeated with submitted hidden field tampered directly |
| Safe `/admin/teachings` redirect | Accepted |
| Revoke temporary owner's membership with session still present | Next protected request denied |
| English/Amharic at 1536, 390 and 320 px | Login and workspace without horizontal overflow; nav tab order, visible focus, password toggle passed |
| Browser JavaScript errors | None in tested flows |
| Cleanup | Both marked temporary accounts and their memberships deleted; zero run accounts verified; pre-existing owner memberships preserved |

Evidence: `verification/phase-4-admin-auth-tests.json`. The runner never deletes users by email pattern or broad table cleanup; it checks the exact user UUID and matching run marker before deletion. The permanent owner's account and membership were independently verified after the final run.

`node scripts/admin-ui-public-check.mjs` additionally tested keyboard Enter submission, disabled submitting button, `aria-busy`, localized errors and re-enabled submission in both languages. It intercepted the same-origin action briefly to observe the pending state, then allowed the real incorrect-credential request. Eight Home/About checks covered both languages at desktop/mobile widths, unchanged public header/footer, no admin shell, no overflow and no browser errors. Evidence: `verification/phase-4-ui-public-checks.json`.

The existing Library/translation regression suite passed its 24 layout cases, 24 article checks and six/twelve sample identity/functionality checks; the Feedback suite passed eight browser cases plus validation boundaries. The existing runners' loopback port was changed only in ignored execution copies to target the production server at 3001. Home, About, Library, details and Feedback retain public sample behavior. Existing evidence files in `docs/previews/` record the regression results.

Limitations: desktop Chrome viewport emulation, not physical devices or other browser engines; draft Amharic copy still awaits client review. Missing configuration is covered by the foundation mocks. A startup-only environment override was attempted for an additional production check, but Next had already inlined the public configuration at build time, so that attempt did not create the missing-configuration condition and is not reported as a passing runtime test. Original local database pgTAP remains unrun because Docker is unavailable. No deployment or full editor/inbox functionality was tested or implemented.

## Credential-free screenshots

| View | English desktop / mobile | Amharic desktop / mobile |
| --- | --- | --- |
| Login, fields empty | [Desktop](previews/phase-4-login-en-1536.png) / [Mobile](previews/phase-4-login-en-390.png) | [Desktop](previews/phase-4-login-am-1536.png) / [Mobile](previews/phase-4-login-am-390.png) |
| Protected workspace, no identity displayed | [Desktop](previews/phase-4-admin-en-1536.png) / [Mobile](previews/phase-4-admin-en-390.png) | [Desktop](previews/phase-4-admin-am-1536.png) / [Mobile](previews/phase-4-admin-am-390.png) |

Visual inspection confirmed the centered sign-in card, original logo, approved fonts, readable bilingual mobile wrapping, visible keyboard focus and honest coming-next sections.

Official references: [Supabase Auth-admin user creation](https://supabase.com/docs/reference/javascript/auth-admin-createuser), [SSR cookie clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [verified getUser identity](https://supabase.com/docs/reference/javascript/auth-getuser).
