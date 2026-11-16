# UI and UX specification

## Paid and source-aware flows

Keep a usable free sample available without an account. When a learner chooses locked material, explain included coverage, exact price/term, non-renewal and offline refresh requirements. Offer a recoverable account at purchase/restore and preserve anonymous study history. Show pending, cancelled, failed, confirmed, expired and restored states; a frontend success animation does not establish entitlement. Return the learner to the selected lesson after verified access.

Use a concise source/date affordance in lessons and references, with fuller source evidence on expansion. Do not expose internal review flags or schema terms in the learner interface. Describe unavailable units plainly and distinguish them from paid units. A payment must not be requested to access content that has not been produced.

Focused implementation specification. See `../product-spec.md` for full product scope and `../../AGENTS.md` for execution rules.

## Navigation and information architecture

Use four primary destinations on compact screens:

| Destination | Learner purpose | Main contents |
| --- | --- | --- |
| **Today** | Decide what to do next | Resume session, due reviews, a recommended study action, 5/10-minute presets, concise progress |
| **Learn** | Understand the syllabus | Paper → module → unit navigation, learning objectives, micro-cards, worked examples |
| **Practice** | Apply and assess knowledge | Topic practice, remediation, numerical questions, case studies, timed mocks |
| **Library** | Find supporting information | Search, formulas, statutory references, calculators, bookmarks, downloaded content |

Calculators are supporting tools within Library and relevant practice flows. Detailed performance is accessible from Today. Do not add separate top-level destinations for every feature.

- Use one clearly labelled paper selector in the app bar. Open a selection sheet with full paper names, abbreviations, elective identification, and availability.
- On the full-syllabus coverage map, the same app-bar selector is labelled “Coverage paper” and browses all nine papers. Its label and page content must agree. Browsing coverage does not change the active study paper, selected elective, history or sessions. Leaving coverage restores the study context; do not add a second paper selector inside the map.
- Label the source-support stage “Full source support”, distinct from having an accessible book. Count it only under the ledger's support rule; explain that an available book alone does not establish full factual support or exam applicability. Keep review and publication separate.
- Keep the app bar focused on the current context and one or two essential actions. Place detailed progress on the relevant screen.
- Use tabs for sibling content views and chips for local filters. Do not use the ambiguous component label "segmented chips."
- Preserve paper scope, filters, scroll position, and unfinished work when moving between destinations.
- Make search scope visible. Offer an explicit way to search all supported papers.
- During active lessons and quizzes, use a focused session layout with clear exit and resume behaviour. Restore primary navigation on exit or completion.
- Adapt navigation to the available window size, using a rail or suitable expanded layout on larger screens.

## Core learner journeys

### 4.1 First use

Collect only what is needed to start: target session, elective, and preferred session length. Make preferences editable. Show available/downloadable content and let the learner begin a useful session quickly. Where local-only study is supported, do not require an account to begin.

### 4.2 Daily study

Today shows one prominent recommendation with its expected duration and a short reason, such as "Review concepts you missed yesterday." Prioritize a resumable session, due reviews, and evidenced weaknesses before introducing additional material. Let learners override the recommendation.

The 5-minute and 10-minute presets should select realistically sized work using estimated reading and question time. Present estimates honestly. Let learners finish early, continue, or resume later.

### 4.3 Lesson and retrieval

Present one learning objective at a time. Let learners expand detail, inspect an example, and attempt a self-check before revealing its answer. Preserve reading position. A viewed card is not automatically a mastered objective.

### 4.4 Practice and mocks

- In learning practice, select or enter an answer, explicitly submit it, then show feedback and explanation. Do not auto-submit or advance merely because an option was tapped.
- In mocks, save responses, support review/flagging and question navigation, and reveal explanations after submission or expiry.
- Explain answer-saving behaviour, unanswered questions, and what happens when time expires.
- Keep scenario information accessible while answering case-study questions.
- On completion, show useful mistakes, learning gains, and one recommended next step.

### 4.5 Interruption and resumption

Save learner actions locally as they occur. Recover after navigation, backgrounding, process termination, or connection loss. Clearly identify resumed work. In timed mocks, use a persisted deadline so backgrounding does not pause the clock; do not rely only on a foreground timer.

## Material 3 design system

Reference: [Material Design 3](https://m3.material.io/).

Use a calm, professional, reading-first visual hierarchy. Minimize unnecessary decisions and competing controls while keeping navigation and learning actions discoverable.

| Area | Required design direction |
| --- | --- |
| Theme | Define shared semantic colour, typography, shape, spacing, and motion tokens. Use supported Material 3 components in the selected stack. |
| Colour | Use surface/container roles and matching foreground roles consistently. Reserve stronger emphasis for important actions and selected states. |
| Personalisation | Provide dependable light and dark palettes. Dynamic colour is optional where supported, with a fallback palette. Tonal surfaces do not require wallpaper-derived colours. |
| Typography | Map page titles, section titles, lesson text, labels, supporting text, and equations to a restrained type hierarchy. Start lesson text around 16sp/16 CSS px with comfortable line spacing, then validate readability. |
| Shape | Use component defaults and shared shape tokens. Document overrides. Do not force every component into fixed 12/16/28px radii; fully rounded controls should use an appropriate full-round shape. |
| Emphasis | Give each screen one clearly dominant action. Keep supporting actions visible with lower emphasis. |
| Motion | Use brief, purposeful state transitions. Respect reduced-motion settings and avoid motion that delays answers or distracts from reading. |

Check the chosen library's support for baseline Material 3 and Material 3 Expressive before selecting variants. Apply a coherent supported set. Do not assume all implementations expose identical components or token names.

Use actual window bounds, system insets, and keyboard behaviour. A 19.5:9 device frame or simulated status bar may be used in a presentation preview; it is not a production layout constraint.

Avoid nested decorative cards, excessive shadows, redundant badges, low-contrast text, and large ornamental headings. Use lists and section spacing where additional containers add no meaning.

## Content-specific layouts and accessibility

| Content | Layout requirements |
| --- | --- |
| Concept | Clear statement, concise explanation, optional example, retrieval question |
| Formula | Readable equation, variable definitions, units, assumptions, worked example |
| Statute | Rule summary, applicability, relevant exceptions, dates, expandable source details |
| Worked example | Inputs, formula, substitutions, intermediate results, final answer with units |
| Numerical input | Required unit, sign/decimal support, stated precision, visible validation and submission |
| Case study | Persistent access to the scenario; supporting pane on wider screens or an accessible expandable scenario on phones |
| Reference table | Clear headers, readable labels, controlled table scrolling when needed |

Requirements:

- On Android, provide at least 48 × 48dp touch targets. For the web implementation, use a product minimum of 48 × 48 CSS px for primary touch controls; use platform-appropriate units rather than treating dp as physical pixels.
- Meet WCAG AA text contrast: at least 4.5:1 for normal text and 3:1 for qualifying large text. Validate both themes and custom answer states.
- Convey correct, incorrect, selected, pending, and unavailable states with text or symbols as well as colour.
- Support system text scaling; check layouts at 200% text size and narrow window widths. Do not clip answers, formulas, or primary actions.
- Supply meaningful control labels, logical focus order, keyboard interaction where relevant, and screen-reader announcements for submitted answers and important state changes.
- Render Unicode correctly, including ₹, mathematical symbols, subscripts, and supported language scripts. Preserve any existing localisation support.
- Keep horizontal overflow confined to content that genuinely needs it, such as a wide equation or table.

Define loading, empty, no-results, offline, download-in-progress, download-failed, update-available, sync-pending, and storage-error states. Each state must explain what happened and offer an appropriate next action without discarding work.

---
