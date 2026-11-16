# Stitch frontend verification — 16 November 2026

Implemented from the three supplied Stitch documents. The canonical token sheet takes precedence over the older overview palette. No external runtime CSS/font dependency, financial grading change, IndexedDB schema/model change or content publication is included.

## Acceptance evidence

| Check | Observed result |
| --- | --- |
| `npm run check` | Typecheck, lint and all 692 tests pass; full output in `check.txt` |
| `npm run build` | Production bundle and service worker built; 3 published packs, 0 fixtures; output in `build.txt` |
| Token contrast | `contrast.json`: 18 light/dark text-role pairs, minimum 6.70:1; all exceed normal-text AA. This is a role-pair check, not blanket AAA or full WCAG certification |
| Light/dark UI | Native Chromium screenshots and computed styles confirm canonical navy/teal surfaces, selected options and correct/wrong feedback |
| Touch targets | Rendered controls on Today, Learn, Account, MCQ and coverage measured at least 48px in each dimension; native radio input itself is smaller inside its full label target. Static badges are not interactive |
| Responsive layouts | Observed at 1280px desktop, 390px mobile, and 320px coverage. No document-level horizontal overflow; financial tables scroll within their own regions |
| 200% text | Actual App entry rendered through an ignored development HTML wrapper with inline root font-size 200%; computed 32px, measured document widths 375/305px in 390/320px viewports. Today, Learn, case player and Account remain reachable; reduced nested padding and full-size navigation labels checked. This is text enlargement, not a browser zoom test |
| MCQ privacy/feedback | Isolated synthetic case: all resting initially; selecting B produces active_selected with zero feedback; explicit submission produces B examiner_trap, D verified_correct and labelled explanations. Both theme pairs observed |
| Keyboard/reload | Native Right arrow moved selection A → B without feedback. Reload restored B and three previously submitted answers. Escape closed the paper sheet and restored focus to the selector |
| Offline persistence | Separate production fixture build at 4174. Stopped its preview server, reloaded the active lesson, revealed/rated a self-check, advanced to step 2, reloaded again and observed step 2 plus the saved-progress resume message. `offline-resume.jpg` records the resulting state. This is stopped-server desktop cache testing, not physical airplane-mode/device testing |
| Existing progress | Main 5173 origin retained the ABM unfinished lesson with 12 steps left. Original Follow device theme restored after visual checks. Answer tests used separate 5174/4174 origins |

## Screenshots

- `today-dark.jpg`: actual Today hero and resume action.
- `module-progress.jpg`: actual four-module progress rings and study counts.
- `paper-switcher.jpg`: native selected-state paper chips in the existing sheet.
- `mcq-light-desktop.jpg`: synthetic case, selected option and explicit submit action after reload.
- `coverage-320.jpg`: narrow coverage layout and readable two-row navigation.
- `account-200-mobile.jpg`: actual Account entry at 200% text on a 320px viewport.
- `offline-resume.jpg`: production fixture statute card after stopped-server reload and persisted advancement.

Screenshots are native browser captures. A full-page capture API caused reflow artifacts, so retained evidence uses native viewport captures. Banking accuracy, content sufficiency, live payments and launch status are unchanged and are not certified by these frontend checks. An account-service-unavailable state was tested; no login or external payment was initiated. Fonts fall back to local system fonts when Inter/JetBrains Mono are not installed.

## Reproduce

Run `npm run dev` for published content, `npm run check`, and `npm run build`. For isolated synthetic checks, use the existing `npm run dev:fixtures` workflow on a distinct origin; do not replace release content with fixtures. For enlarged text, a temporary development-only HTML entry can set `<html style="font-size:200%">` while loading `/src/app/main.tsx`. That wrapper is ignored under `.scratch/` and excluded from the production build. The stopped-server fixture check used an isolated generated public directory and production output, also under `.scratch/`.
