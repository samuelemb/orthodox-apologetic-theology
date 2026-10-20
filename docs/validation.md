# Phase 1 validation

Performed 2026-10-08 on Windows with Node 24.12.0 and npm 11.9.0.

## Story

A visitor opens a public placeholder, navigates using the desktop or mobile header, changes interface language, and reloads with that device-local preference preserved. There is no API or database boundary in this phase.

## Automated command checks

| Check | Result |
| --- | --- |
| `npm run build` | Passed; four public routes statically generated plus Next's default not-found page |
| `npm run typecheck` | Passed; `next typegen` and `tsc --noEmit` with `strict: true` |
| `npm run lint` | Passed with no warnings after fixing one anonymous-export warning |
| `npm audit --omit=dev` | Passed; zero vulnerabilities |
| `npm audit` | Five high-severity development-tool findings; underlying braces advisory and tooling compatibility limitations documented in README |

## Browser evidence

Checked the production server on http://127.0.0.1:3000 in Codex's Chromium in-app browser.

- Desktop shell inspected at 1280px: branding, centered navigation, language controls, footer and placeholder layout.
- All four public pages visited through navigation; titles and copy changed correctly.
- Active links exposed `aria-current="page"`; Feedback active in both header and footer after navigation.
- Both logo images reported `complete: true` with positive natural width.
- Switching to Amharic changed visible navigation, branding, headings, placeholder and footer text; `<html lang>` became `am`.
- Reload preserved Amharic; switching back restored English.
- Mobile Amharic layout visually inspected at 390×844; Ethiopic glyphs rendered.
- Narrow English layout visually inspected at 320×740.
- Document scroll width equaled viewport width at the checked 1280px, 390px, and 320px widths.
- Enter opened the mobile menu and exposed expanded state. Escape from a navigation link closed it and restored focus to the menu button.
- Keyboard focus had a visible gold outline (computed solid outline, approximately 3 CSS px).
- Tab reached the skip link; Enter moved focus to `main-content`.
- Additional Amharic checks at 320px and the 1024px desktop breakpoint showed no horizontal overflow; the long brand wraps within its grid column.
- Pointer activation opened the menu; choosing Teachings navigated and collapsed it.
- Browser warning/error log was empty during this flow, including the preference reload; no hydration warnings observed.

Final reference captures are saved in `docs/previews/phase-1-desktop.png` and `docs/previews/phase-1-mobile.png`.

## Limits

This is browser viewport testing, not physical touchscreen testing. Safari, Firefox, screen readers, disabled-storage behavior, and cross-tab synchronization were not manually exercised. No full accessibility conformance claim is made. Amharic needs native-language/client review. The Telegram link destination is verified in the rendered DOM; the external channel was not opened or modified. Future teaching detail, forms, search, database, authentication, and admin flows are intentionally absent.
