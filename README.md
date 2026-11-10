# CAIIB Study

An offline-first learning app (installable web app) for the CAIIB examinations, with a small backend for
accounts, purchases and signed offline access. Built from the specification in `docs/` and `AGENTS.md`.

**Current status is in [PROJECT_STATE.md](PROJECT_STATE.md).** In short: the application and backend work and
are tested; **no real curriculum has been authored yet** and the exam rules for the session are unverified, so a
release build ships with the syllabus coverage map but no lessons.

## Run it

Needs Node.js 22.18 or newer. On Windows PowerShell use `npm.cmd` if `npm` is blocked.

```sh
npm ci --ignore-scripts
npm run dev:fixtures   # web app on http://localhost:5173 with SYNTHETIC sample content
npm run server         # optional API on http://localhost:8787 (accounts, simulated payments, sync)
```

`dev:fixtures` loads arithmetic-only engineering fixtures so every screen can be exercised. They are labelled
in the app and are never part of a release build. `npm run dev` runs the app with release content only.

## Check and build

```sh
npm run check          # type check, lint, all tests
npm run build          # release build in dist/ with service worker (no fixtures)
npm run build:fixtures # offline-test build in dist-fixtures/ (fixtures included; not for release)
```

## Layout

| Path | What it is |
| --- | --- |
| `src/core/` | View-independent logic: exact decimal grading, SM-2 scheduling, evidence and readiness, sessions and mocks, pack verification, entitlement verification, calculators, coverage model |
| `src/storage/` | IndexedDB persistence with atomic batches |
| `src/app/` | The React UI (Today, Learn, Practice, Library, coverage map, account) |
| `server/` | API: sign-in codes, purchase ledger, Razorpay and local-simulation adapters, signed entitlements, progress sync, content delivery |
| `src/types`, `src/validation`, `src/import` | Contracts, validators and draft importer from the original kit (unchanged) |
| `content/` | Exam contexts, published packs (none yet), objectives and ledger records, synthetic fixtures |
| `scripts/` | Content build, service-worker build, fixture generator, kit CLIs, `ui-audit.js` |
| `docs/` | Product specification and focused specs; [docs/operations.md](docs/operations.md) for deployment |
| `visual-map/` | Syllabus transcription used to build the catalogue and ledger |

## Content

`npm run content:build` turns `visual-map/source-data.json`, `content/objectives/`, `content/ledger/` and
`content/packs/` into the catalogue, coverage ledger and manifest the app loads. A published pack must pass
`validatePack`; synthetic material cannot be published. Authoring workflow: `docs/specs/content-pipeline.md`.

## Payments

Development uses a **local simulation** of the provider; no money moves. Real payments need Razorpay keys,
publisher support/refund text and an explicit live switch; see `docs/operations.md` and `.env.example`.
The proposed price (₹399 for six months) is a test proposal, not an approved offer.
