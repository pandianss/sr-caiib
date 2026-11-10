# Learning engine

## Evidence semantics

Only objectively scored answer events contribute to accuracy. Self-assessed recall and lesson completion support study scheduling/coverage but do not manufacture a correct answer. Derive first exposure after event deduplication and reconciliation across devices; do not trust a client-provided boolean. Evidence from a corrected answer/content revision must be handled by a documented version-compatibility rule.

Timed evidence is a subset of eligible assessed questions. Exclude zero/negative, idle-contaminated or otherwise invalid timings under a recorded policy; never divide by zero. Preserve the raw evidence for audit. The minimum sample threshold means the score can be calculated, not that the learner is ready to pass. Use `sufficient_evidence`/`insufficient_evidence` and show component values.

Use a stable initial SM-2 implementation: quality grades Again=1, Hard=3, Good=4, Easy=5; EF initially 2.5 with floor 1.3. On success, select the interval from the previous repetition count and ease factor before applying the new ease update. Increment repetitions only for a successful scheduled review. On failure, reset repetitions, schedule the one-day review and offer immediate relearning; an immediate retry is excluded from independent accuracy evidence. Keep all scheduling rules versioned and test timezone/calendar boundaries. The kit provides state/event contracts and these algorithms as specifications, not a completed scheduler implementation.

Focused implementation specification. See `../product-spec.md` for full product scope and `../../AGENTS.md` for execution rules.

## Learning design and question quality

Use the following app-defined six-step learning loop. Do not describe it as an official IIBF methodology without a verified source:

1. **Orient:** state the objective and recall any necessary prerequisite.
2. **Learn:** explain one concept, rule, or formula.
3. **Apply:** demonstrate a relevant example or calculation.
4. **Retrieve:** ask the learner to answer before seeing the explanation.
5. **Correct:** explain mistakes and address misconceptions.
6. **Review:** schedule later retrieval and update evidence of understanding.

Card types remain `concept`, `formula`, `statute`, and `worked_example`.

- Keep one primary objective per card. Aim for roughly 50–150 words in the initial explanation; expand when necessary. Longer 150–300-word explanations may sit behind progressive disclosure. Do not pad content to meet a word count.
- Each card has at least one meaningful self-check linked to its objective. Keep the answer hidden until the learner attempts or explicitly reveals it.
- Define prerequisites and related concepts without forcing unnecessary reading.
- Formula cards name variables, units, assumptions, conventions, and common errors. Statute cards include sections, thresholds, timelines, penalties, and exceptions only where applicable and verified.
- Worked examples expose intermediate working and a final answer with units. Verify calculations independently with deterministic code or another reproducible method before publication.

Question quality:

- Easy questions test direct understanding; medium questions require straightforward application; hard questions require multi-step reasoning. Difficulty labels are initial editorial estimates and may be recalibrated from evidence.
- Require an explanation for the correct answer and a useful rationale for each distractor. Use realistic misconceptions, not ambiguous wording or superficial tricks.
- Specify all necessary facts, assumptions, units, valuation dates, interest conventions, and rounding rules.
- Use case narratives around 100–200 words and typically four or five related questions when the topic warrants them. Adjust length to the learning need. Each question must be answerable from the scenario without carrying forward an earlier wrong answer.
- In learning mode, offer calculation support after an attempt. Mock-mode tools must follow the verified exam configuration; a worked solver must not reveal answers during a mock.
- Distinguish practice selection rules from official exam distributions. Keep editorial difficulty mixes configurable.

## Spaced review, remediation, and readiness

### 11.1 Spaced review

Preserve a tested existing scheduler. Otherwise use one documented, deterministic SM-2 implementation for the initial release rather than mixing algorithms.

- Support `Again`, `Hard`, `Good`, and `Easy`. For a new SM-2 implementation, map these to quality grades 1, 3, 4, and 5; start the ease factor at 2.5 with a minimum of 1.3. Use successful intervals of 1 day, 6 days, then the previous interval multiplied by the previous ease factor, rounded to the nearest whole day. Update ease using `EF' = max(1.3, EF + 0.1 - (5-q) × (0.08 + (5-q) × 0.02))`.
- On `Again`, reset the successful-repetition count, set the next interval to 1 day, and offer an in-session relearning attempt. Do not count the immediate retry as independent mastery evidence. Document the time-zone/day-boundary policy and algorithm version. A retained existing scheduler may use its own documented rules.
- Failed recall must trigger relearning and an earlier review. A wrong answer cannot be converted into demonstrated mastery by a high confidence rating.
- Record objective answer correctness separately from self-reported confidence.
- Persist review state locally. Reopening an explanation, changing tabs, or retrying a failed sync must not create a second review event.

### 11.2 Remediation and false mastery

Calculate weakness from distinct question evidence with dates and sample counts. As an initial product rule, flag module accuracy below 60% only after at least 10 distinct first-response questions within the last 30 days. Make these thresholds configurable and label them as product choices.

Where evidence is insufficient, show "Not enough practice yet." Generate targeted remediation around the actual missed objectives and misconceptions. Track high-confidence errors and schedule a later transfer question or unseen variant; immediately repeating the same item is not proof of mastery.

### 11.3 Experimental CAIIB Readiness Index

Retain the original weighting only as a transparent, experimental study indicator:

`CRI = 0.4 × C + 0.4 × A + 0.2 × S`

All inputs are on a 0–100 scale and are calculated per paper and exam context:

- `C`: percentage of mapped learning objectives with a completed learning unit and submitted self-check. Label this **study coverage**, not mastery.
- `A`: percentage correct on distinct, first-exposure scored questions in the last 30 days. Exclude answer-revealed items, repeats, and incompatible content versions from this assessment sample.
- `S`: for eligible timed first-exposure questions, take the mean of `correct × min(1, target_seconds / elapsed_seconds)`, then multiply by 100. `correct` is 1 or 0; an incorrect answer contributes zero. Exclude idle or invalid timing records under a documented policy.

Show a numeric CRI only when both accuracy and timing have at least 20 eligible questions and the official objective denominator is available. Otherwise show "Insufficient evidence" and display the available components without silently replacing missing data or changing weights.

Expose sample counts, date ranges, and the formula. Report study coverage, assessed accuracy, due reviews, and mock performance separately. Do not describe CRI as a calibrated pass probability or use it to guarantee exam success.

---
