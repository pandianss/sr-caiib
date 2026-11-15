# CAIIB Learning App — Agent Technical Briefing & Architecture Guide

A comprehensive technical and domain guide for autonomous AI agents collaborating on the CAIIB exam preparation progressive web application.

---

## 1. Product Overview & Purpose

The **CAIIB Learning App** is an offline-first, mobile-first Progressive Web Application (PWA) designed specifically for working Indian commercial bankers preparing for the **CAIIB (Certified Associate of the Indian Institute of Bankers)** certification, the premier professional qualification administered by the **IIBF (Indian Institute of Banking & Finance)**.

### Target Exam & Regulations
- **Target Exam Session**: **CAIIB December 2026** (`CAIIB-2026-DEC`).
- **Exam Pattern**: 100 questions / 100 marks (IIBF may vary slightly), 120 minutes, pass mark 50/100, no negative marking, non-programmable calculator allowed.
- **Regulatory Cut-Off**: **30 June 2026**. All Reserve Bank of India (RBI) Master Directions, circulars, statutory enactments, tax thresholds, and banking ratios must strictly reflect the state of law in force as of 30 June 2026. Any post-cutoff circulars or transitional draft papers are excluded from learner examination questions.

### The Core Learner Loop
The application is engineered around three concise daily questions for time-constrained banking professionals:
1. **What should I study next?** Adaptive recommendation engine surfacing unstudied topics, due spaced-repetition items, and recorded weak areas.
2. **Can I apply it correctly?** Multi-modal study items: bite-sized concept cards, worked step-by-step examples, single-choice MCQs, realistic multi-question case studies, and numerical questions without options.
3. **What should I review later?** Spaced repetition scheduling based on modified SuperMemo SM-2 algorithms, flagging low-confidence or incorrectly answered learning objectives.

---

## 2. Complete Syllabus Scope (9 Papers)

The application implements the official 2026 IIBF syllabus encompassing **276 official topics** across 4 compulsory subjects and 5 supported electives:

### Compulsory Papers (4)
1. **`ABM` — Advanced Bank Management** (32 topics)
   - *Module A*: Statistics (Sampling, Probability, Time Series, Linear Programming, Simulation).
   - *Module B*: Human Resource Management (HRD, HRM fundamentals, Motivation theories, Training, Appraisals).
   - *Module C*: Credit Management (Working capital, Term loans, Credit appraisal, Restructuring, IBC 2016, CDR/SARFAESI).
   - *Module D*: Compliance in Banks & Corporate Governance (Compliance risk, Compliance audit, GRC framework, Vigilance & Fraud risk).
   - *Current Status*: **100% complete, reviewed, and published** in release pack `ABM-2026DEC@47.json` (2,174 items).

2. **`BFM` — Bank Financial Management** (31 topics)
   - *Module A*: International Banking & Forex (Foreign exchange arithmetic, LRS, NRI accounts, Letters of Credit under UCP 600, Export finance, ECBs).
   - *Module B*: Risk Management & Basel Accords (Credit, Market, Operational Risk, Basel III, Capital Adequacy / CRAR, LCR & NSFR).
   - *Module C*: Treasury Management (Money market products, G-Secs, Derivatives, Swaps, VaR, Duration & ALM).
   - *Module D*: Balance Sheet Management (ALM guidelines, Capital adequacy, Asset classification & Provisioning norms, RAROC & Profit planning).
   - *Current Status*: **100% complete, drafted, and audited** across Modules A–D (31 units).

3. **`ABFM` — Advanced Business & Financial Management** (25 topics)
   - *Module A*: The Management Process (Planning, Organizing, Staffing, Directing, Controlling).
   - *Module B*: Advanced Financial Management (Leverage analysis, Capital investment decisions, Risk analysis, Decision making).
   - *Module C*: Valuation, Mergers & Acquisitions (Corporate valuation, DCF & non-DCF models, M&A deal structuring).
   - *Module D*: Emerging Business Solutions (Hybrid finance, Startup financing, PE & VC, AI in banking, Green finance, SPACs).
   - *Current Status*: **100% complete, drafted, and audited** across Modules A–D (25 units).

4. **`BRBL` — Banking Regulations & Business Laws** (64 topics)
   - *Module A*: Regulations & Compliance (Legal framework of regulation, RBI Act 1934, BR Act 1949, Types of banks, NBFC Scale-Based Regulation, FSDC).
   - *Module B*: Important Acts & Legal Aspects Part A (PMLA 2002, Negotiable Instruments Act 1881, FEMA 1999, PSS Act 2007, Securities & Charges).
   - *Module C*: Important Acts & Legal Aspects Part B (RBI Ombudsman Scheme 2021, MSMED Act 2006, SARFAESI Act 2002, DRT Act 1993, IBC 2016, Consumer Protection Act 2019, Law of Limitation).
   - *Module D*: Commercial & Other Laws (Indian Contract Act 1872, Sale of Goods Act, Partnership Act, Companies Act 2013, LLP Act 2008, Transfer of Property Act 1882, RTI Act 2005, IT Act 2000, Prevention of Corruption Act 1988).
   - *Current Status*: Modules A and B (Units 1–5) fully audited and approved; authoring active on remaining modules.

### Elective Papers (5 Supported)
- **`CB` — Central Banking** (27 topics): Rationale, Functions, Reserve Bank of India, Monetary Policy, FX Reserves, Financial Markets, Regulation & Supervision. *Status: Modules A, B, C, D complete (12 units audited)*.
- **`RM` — Risk Management** (26 topics).
- **`ITDB` — Information Technology & Digital Banking** (24 topics).
- **`HRM` — Human Resources Management** (28 topics).
- **`RB` — Rural Banking** (27 topics).

---

## 3. Architecture & Tech Stack

The system is constructed with strict engineering discipline to ensure high performance, total local data privacy, and 100% reliable offline operation:

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT (PWA)                           │
│  React 19  •  TypeScript  •  Vite 7  •  Material 3 CSS Tokens   │
├────────────────────────────────┬────────────────────────────────┤
│      LEARNING ENGINE CORE      │        OFFLINE STORAGE         │
│  Deterministic Grading Policy  │       IndexedDB Repositories   │
│  SuperMemo SM-2 Interval Logic │       Service Worker Cache     │
│  CRI Mathematical Metrics      │       WebCrypto ES256 Verify   │
└────────────────────────────────┴────────────────────────────────┘
                               ▲  (progress sync / purchases)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MINIMAL NODE.JS SERVER                     │
│  Built-ins only: node:http • node:sqlite • node:crypto          │
│  Zero third-party runtime frameworks (no Express, no Prisma)   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Engineering Invariants
1. **Frontend Architecture**:
   - Single Page Application built on React 19 and Vite 7.
   - Styling: Hand-crafted, semantic Material 3 CSS custom properties (`src/app/styles.css`).
   - Accessibility: $\ge 48\text{px}$ touch target hit areas, 200% font scaling support without horizontal clipping, light/dark mode tokens, and explicit aria labels.
2. **Deterministic Grading Engine (`src/core/grading.ts`)**:
   - Numerical calculations use decimal arithmetic or appropriately bounded scaled integer representations (BigInt / exact cents/paise).
   - Rounding and units are explicitly defined per question.
   - **Zero Runtime LLMs**: AI models are NEVER used to grade student submissions at runtime.
3. **Spaced Repetition (`src/core/sm2.ts`)**:
   - Objective-level mastery tracking. Wrong answers force immediate relearning state and reset repetition intervals.
   - **Composite Readiness Index (CRI)**: Formulated as $\text{CRI} = 0.4C + 0.4A + 0.2S$ (Coverage, Accuracy, Speed).
4. **Offline Entitlement Verification (`src/core/entitlements.ts`)**:
   - Paid full syllabus packs require cryptographic proof of purchase.
   - Validated offline via **ES256 (P-256 ECDSA) compact JWS tokens** using the browser's native `window.crypto.subtle` API.
   - Local boolean flags like `isPaid = true` or checkout return callbacks are strictly untrusted.
5. **Exam Simulation**:
   - Full 100-question mock exams enforce a persistent absolute wall-clock deadline (`expires_at`). App backgrounding or page refreshing cannot extend exam time.

---

## 4. Multi-Agent Operating Model

The codebase operates under a formal separation of powers defined in `AGENTS.md`. No single agent is permitted to both draft content and grant publication approval.

```
┌──────────────────────────────────────────────┐
│           AUTHORING AGENT (Claude/Codex)      │
│  - Reads courseware PDFs & statutory acts    │
│  - Writes fresh, original explanations/items  │
│  - Implements deterministic calculation tests│
│  - Creates batches in DRAFT (review = null)  │
│  - Never self-certifies content              │
└──────────────────────────────────────────────┘
                       │
                       ▼ (git commits & draft bundles)
┌──────────────────────────────────────────────┐
│         REVIEW & QUALITY AGENT (Antigravity) │
│  - Enforces zero-stub distractor quality     │
│  - Verifies banking & regulatory accuracy    │
│  - Executes automated calculation tests      │
│  - Maintains AUDIT_REGISTER.md               │
│  - Approves batches for pack publication     │
└──────────────────────────────────────────────┘
```

### Golden Content Rules for Authoring Agents
- **Strict Original Authorship**: Source PDFs establish historical and legal facts only. Copying textbook paragraphs, using close paraphrases, or modifying textbook questions by merely swapping names or numbers is forbidden.
- **Distractor Explanation Standard**: Every incorrect option in a 4-choice question must have a meaningful explanation ($\ge 20$ characters) detailing *why* it is wrong in the context of the problem. Explanations like `"Incorrect."`, `"Not so."`, or `"As per the rule."` are rejected automatically by `scripts/audit-content-quality.mjs`.
- **Answer Key Uniformity**: The correct answer letter (`A`, `B`, `C`, `D`) must be evenly distributed across all questions in a batch (e.g. ~25% per option).
- **Mandatory Calculation Tests**: Any question requiring financial arithmetic, date intervals, statutory penalty ceilings, or ratio calculations must be covered by a deterministic Node.js test in `tests/content/`.

---

## 5. Repository File Map & Artifact Reference

```
D:\projects\sr-caiib\
├── AGENTS.md                                # Permanent multi-agent operating contract
├── PROJECT_STATE.md                         # Living execution state, decisions, & acceptance matrix
│
├── content/
│   ├── audit/
│   │   ├── AUDIT_REGISTER.md                # Official audit register tracking all findings & approvals
│   │   └── REPORT_001_REGULATORY_*.md       # Detailed audit reports and handover documentation
│   ├── batches/                             # Unit-level authoring batches (e.g. BFM-D-U01-B001)
│   │   └── <BATCH_ID>/
│   │       ├── staging.json                 # Extracted facts and raw items
│   │       ├── import-config.json           # Objective mappings and ancestry
│   │       ├── draft-bundle.json            # Validated draft items (publication_state = "draft")
│   │       └── review.md                    # Review log and limits
│   ├── objectives/                          # Versioned learning objectives per paper (ABM, BFM, etc.)
│   ├── sources/
│   │   ├── registry.json                    # Canonical provenance registry of all acts, circulars, books
│   │   ├── books/                           # Official IIBF courseware scans (S01 to S05)
│   │   └── primary/                         # Primary government/RBI circulars and statutory PDFs
│   └── syllabus/
│       └── caiib-2026.json                  # Canonical IIBF 2026 syllabus tree
│
├── public/content/packs/                    # Published release packs (e.g. ABM-2026DEC@47.json)
├── scripts/
│   ├── audit-content-quality.mjs            # Automated quality auditor for stubs, runs, and case links
│   ├── build-content.mjs                    # Content compilation and ledger reconciliation
│   ├── import-staging.mjs                   # Staging envelope parser and ID generator
│   └── publish-pack.mjs                     # Pack packaging tool
│
├── src/
│   ├── app/                                 # UI components, screens, and styles
│   ├── core/                                # Learning engine: grading, SM-2, CRI, entitlements
│   ├── server/                              # Node.js backend: commerce, sync, WebCrypto verification
│   └── storage/                             # IndexedDB persistence layer
│
└── tests/
    ├── content/                             # Calculation and content validation tests
    ├── core/                                # Engine unit tests
    └── server/                              # Backend commerce and offline entitlement tests
```

---

## 6. Standard Content Authoring Procedure

When an incoming authoring agent begins work on a new unit:
1. **Source Inspection**: Render the relevant courseware pages from `content/sources/books/` using `scripts/render-page.mjs`. Verify sensitive rules against primary RBI directions in `content/sources/primary/`.
2. **Register Objectives**: Define granular learning objectives in `content/objectives/<PAPER>.json`.
3. **Draft Staging**: Create `content/batches/<BATCH_ID>/staging.json` containing facts and questions.
4. **Draft Bundle Generation**: Configure `import-config.json` and run `npm run import:staging`.
5. **Calculation Verification**: Write a test suite in `tests/content/batch-<batch-id>.test.ts` recomputing all mathematical steps with exact precision.
6. **Self-Audit**: Execute `node scripts/audit-content-quality.mjs content/batches/<BATCH_ID>/draft-bundle.json`. Confirm that the stub option rate is **0.0%**.
7. **Draft Handover**: In `review.md`, document all limits, cite exact source pages, set `publication_state: "draft"` and `review: null`, and commit to Git. The review agent (Antigravity) will independently verify, audit, and approve the batch.
