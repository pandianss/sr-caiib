# Project execution state

Last updated: 10 November 2026 (session 1, stopped at a usage limit — not at a completion point).

## Scope and decisions

- Product specification revision: `docs/product-spec.md`, 10 November 2026 (autonomous full-project delivery).
- Platform: greenfield, no platform specified → mobile-first TypeScript PWA with IndexedDB, plus a minimal Node backend for accounts, purchases and entitlements (as the spec prescribes).
- Target session: CAIIB 2026 — **not yet verified against an official IIBF source**.
- Repository: `D:\projects\sr-caiib` has its own git repo (the drive-wide `D:\` repo ignores `projects/*`). **No commit exists yet**: `git commit` failed because no git author identity is configured. All files are staged.
- Source access available: only `visual-map/source-data.json` (2025 elective booklet transcription). No NotebookLM access, no PDFs, no web fetch of IIBF documents has been done.
- Consequential decisions:
  - Kit contents were copied to the repo root (`docs/`, `src/types`, `src/validation`, `src/import`, `scripts/`, `tests/`, `data/`, `visual-map/`); the original `caiib-agent-kit/` is left untouched and git-ignored.
  - Backend uses only Node built-ins (`node:http`, `node:sqlite`, `node:crypto`); zero runtime dependencies.
  - Offline entitlement tokens are ES256 (P-256) compact JWS, chosen for universal WebCrypto support.
  - Account recovery is email + one-time code. Production needs an HTTP mail endpoint (`MAIL_MODE=http`).
  - UI components will be hand-built on Material 3 tokens (no maintained React M3 library); not started.
  - One active pack per paper; a "full" pack is installed only when entitled, with `free_unit_ids` staying open after expiry.
  - Numeric grading policy `GRADING_POLICY_V1`, scheduler `SM2_V1`, evidence policy `EVIDENCE_POLICY_V1` are documented at the top of `src/core/grading.ts`, `sm2.ts`, `evidence.ts`.
  - Test price ₹399 / 6 months is a configurable proposal (`server/commerce.ts`), not an approved offer.
- Optional backlog: Google Play Billing route, cloud-hosted CMS, dynamic colour.

## Delivery status

| Dimension | Status | Evidence or remaining condition |
| --- | --- | --- |
| Implementation | in_progress | Engine, storage and backend done and tested. **No UI, service worker, content build scripts or in-app coverage map yet.** |
| Original full-syllabus content | blocked | No source access; zero lessons or questions authored. Compulsory-paper syllabus missing. |
| Release readiness | pending | Depends on the two rows above. |
| Live launch | pending | Owner action; not started. |

## Acceptance and work queue

| ID | Required outcome | Status | Evidence / next action |
| --- | --- | --- | --- |
| E1 | Deterministic grading (choice + numeric, no tolerance) | passed (engine) | `tests/core/grading.test.ts` |
| E2 | SM-2 scheduler, idempotent review events, time-zone day boundary | passed (engine) | `tests/core/sm2-evidence.test.ts` |
| E3 | Derived first exposure, CRI thresholds, weak-area minimum evidence | passed (engine) | `tests/core/sm2-evidence.test.ts` |
| E4 | Pack checksum/schema verification, atomic activation, last-known-good, pinning | passed (engine) | `tests/core/storage-session.test.ts` |
| E5 | Paper isolation (BFM vs ABFM), scoped search | passed (engine) | same file |
| E6 | Practice explicit submit; mock persisted deadline, expiry grading | passed (engine) | same file |
| E7 | Persistence across restart (IndexedDB via fake-indexeddb) | passed (engine) | same file; real-browser check pending |
| C1 | Purchase ledger: spoofed callback, mismatch, duplicate/out-of-order webhooks, refund, restore, wrong account | passed (LOCAL SIMULATION only) | `tests/server/commerce.test.ts` |
| C2 | Signed offline entitlement: counterfeit, wrong account, lease, expiry, clock rollback, bounded finish | passed (local) | same file |
| C3 | Progress sync idempotent by event ID | passed (local) | same file |
| C4 | Razorpay sandbox verification | blocked | Needs owner's Razorpay test keys. Adapter written from known API behaviour; **current official docs not re-checked**. |
| U1 | PWA UI: Today / Learn / Practice / Library, paper selector, onboarding, lesson/practice/mock players, paywall states | pending | Not started. Next task. |
| U2 | Service worker / offline shell, pack download management UI | pending | Not started. |
| U3 | Accessibility + adaptive layout inspection (narrow/wide, light/dark, 200% text) | pending | Needs U1. |
| K1 | Catalogue + coverage ledger generated from `visual-map/source-data.json`; `scripts/build-content.mjs`, `scripts/build-sw.mjs` | pending | Scripts are referenced in `package.json` but **do not exist yet**, so `npm run build` fails. |
| K2 | In-app visual coverage map reconciled with the ledger | pending | `src/core/coverage.ts` model exists; no data or screen yet. |
| K3 | Official baseline for ABM, BFM, ABFM, BRBL; verified exam configuration and cutoff | blocked | Needs IIBF documents (owner approval to fetch, or supplied PDFs). |
| K4 | Original reviewed curriculum, all nine papers | blocked | Needs NotebookLM access or PDF exports. |
| Q1 | Lint | pending | ESLint installed, no config written, never run. |
| Q2 | Packaging, deployment docs, `.env.example`, README | pending | Not started. |

## Source and content checkpoint

- Source inventory: `caiib syllabus.pdf` (elective booklet 2025, sha256 `3a45f14f…5590`, per `visual-map/source-data.json`); session applicability unconfirmed.
- Official baseline: electives provisional (25 modules, 2 appendices, 123 named sections + 1 editorial container); four compulsory papers missing.
- Ledger: not generated yet. Official topic denominator: unknown. Objectives derived: 0.
- Completed / reviewed / published counts: 0 / 0 / 0.
- Latest batch: none. Next cursor: generate catalogue + ledger (K1), then first elective batch once sources are accessible.
- Visual map: original kit planning map only (`visual-map/coverage-map.html`).

## Verification log

| Check | Environment | Command | Observed outcome | Limitations |
| --- | --- | --- | --- | --- |
| Kit contract tests | Windows 11, Node 24.21.0 | `node --test "tests/*.test.mjs"` | 110 passed, 0 failed | Synthetic fixtures |
| Engine tests | same | `node --test "tests/core/*.test.ts"` | 39 passed, 0 failed | Synthetic fixtures; IndexedDB is fake-indexeddb |
| Backend tests | same | `node --test "tests/server/*.test.ts"` | 14 passed, 0 failed | Local simulation; not provider sandbox |
| Type check (core + server + tests) | same | `node_modules\.bin\tsc.cmd --noEmit -p tsconfig.json` | no errors | `tsconfig.app.json` not yet exercised (no UI) |
| Full `npm test`, lint, build, rendered UI | — | — | not_run | |

## Blockers

| Dependency | Affected tasks | Minimum external action |
| --- | --- | --- |
| Git author identity | First commit | Set `user.name` / `user.email` for this repo, or say which identity to use |
| Official IIBF syllabus/session documents | K3, exam config, mocks in release | Approve fetching from iibf.org.in, or drop the PDFs into the repo |
| NotebookLM sources or PDF exports | K4 (all content) | Sign in to NotebookLM in the browser pane, or place authorized exports in the repo |
| Razorpay test keys | C4 | Put test keys in a local `.env` (never in chat or git) |

## Resume instruction

- Last completed logical unit: backend commerce + tests (all green).
- Unfinished: nothing half-written; `package.json` scripts `build`, `content:build`, `dev:fixtures` reference scripts/config not yet created.
- Exact next action: write `scripts/build-content.mjs` (catalogue + ledger from `visual-map/source-data.json`, fixture manifest in fixtures mode), then `vite.config.ts`, `index.html` and the React app under `src/app/` using `src/core` and `src/storage`.
- Regenerate fixtures: `node scripts/make-fixtures.mjs`. Run API: `npm run server` (http://localhost:8787, simulated payments).
- Next full acceptance reconciliation: after U1–U3.
