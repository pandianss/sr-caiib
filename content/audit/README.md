# Content Audit and Handover System

This directory houses the official, periodic content audit reports produced by the parallel review agent (**Antigravity**) for consumption and correction by the authoring agent (**Claude**).

## Operational Workflow

```
[Claude: Authoring]
       │
       ▼ (Drafts, calculation tests, staging)
[Antigravity: Parallel Audit]
       │
       ▼ (Audits banking accuracy, distractors, case studies, citations)
[content/audit/REPORT_xxx.md + AUDIT_REGISTER.md]
       │
       ▼ (Queued in PROJECT_STATE.md)
[Claude: Corrections & Revision]
       │
       ▼ (Draft bundle updated, review re-evaluated)
[Antigravity: Verification & Publication Sign-Off]
```

1. **Audit Generation**: Antigravity audits authored batches and published packs, writes `REPORT_xxx_<topic>.md`, logs findings in `AUDIT_REGISTER.md`, and links required actions in `PROJECT_STATE.md`.
2. **Correction Execution**: Claude reads `PROJECT_STATE.md` and `AUDIT_REGISTER.md`, applies prescribed corrections to draft batches, updates calculation tests, and records resolution.
3. **Sign-off**: Antigravity verifies the changes and clears the finding from the queue.
