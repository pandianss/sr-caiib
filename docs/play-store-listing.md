# Google Play store listing: CAIIB Study (draft)

Fill the `[...]` placeholders. Keep every claim true of the version you upload; the syllabus is added in stages.

## Basics

- **App name (max 30):** CAIIB Study: Practice
- **Category:** Education. **Type:** App. **Free.** No ads. No in-app purchases in release 1.
- **Default language:** English (India).
- **Contact email:** [SUPPORT EMAIL] · **Privacy policy URL:** [PUBLIC URL OF docs/privacy-policy.md]

## Short description (max 80)

Independent CAIIB study and practice app. Works offline. Content added in stages.

## Full description (max 4000)

CAIIB Study helps working bankers prepare for the CAIIB examinations with short lessons, exam-style practice and
spaced review, all of which work offline.

This is an independent app. It is not affiliated with, endorsed by or sponsored by the Indian Institute of
Banking & Finance (IIBF).

WHAT YOU CAN DO
• Today: see what to study next, resume where you stopped, or choose a 5 or 10 minute session.
• Learn: follow the syllabus paper by paper, module by module and unit by unit, with short lesson cards, worked
  examples and formula cards.
• Practice: answer questions, then submit to see feedback and an explanation for every option. Practise by topic,
  numerical questions, missed objectives, case studies and timed mocks.
• Review: cards you could not recall come back at spaced intervals. Your confidence rating is kept separate from
  whether your answer was actually correct.
• Library: search lessons and formulas and use banking calculators.
• Coverage map: see exactly which papers, modules and topics have lessons and questions, and which are still
  being prepared. Nothing is hidden.

BUILT FOR REAL STUDY
• Works fully offline. Your progress is saved on your phone after every step.
• Numerical answers are checked with exact decimal arithmetic, not guesses.
• Readable text, light and dark themes, large touch targets, and support for larger text sizes.
• No account, no ads and no tracking. Your study data stays on your device.

CONTENT IS BEING ADDED IN STAGES
This release contains the lessons and questions that have been completed and reviewed so far. The syllabus is
large, and more papers and topics will arrive in app updates. Open the coverage map in the app to see what is
available now. The app is a study aid; it does not guarantee any examination result.

Papers covered over time: Advanced Bank Management, Bank Financial Management, Advanced Business & Financial
Management, Banking Regulations & Business Laws, and the elective papers.

Content reflects the syllabus for the stated examination session and is not legal, regulatory or financial advice.
Always check current IIBF notices and official regulatory sources.

## Graphics checklist

- App icon 512×512 PNG (export from `public/icon.svg`, no transparency issues on a plain square).
- Feature graphic 1024×500 PNG.
- Phone screenshots (2 to 8, 16:9 or 9:16, min 320 px): Today, Learn (module list), a lesson card, a practice
  question with feedback, the coverage map. Take them from the Android build, not the engineering fixture build,
  so the "synthetic sample content" banner is not visible.

## Store settings answers

- **Target audience:** adults (18+). Not designed for children; not in Families.
- **Content rating (IARC):** no violence, sexual content, profanity, gambling or user-generated content; no
  location sharing. Expected rating: Everyone.
- **Ads:** none. **In-app purchases:** none in release 1.
- **News app / government app / health app / financial features declarations:** answer "No" to each; the app is
  an educational study aid and offers no financial products, loans, trading or advice.

## Data safety form

- Does the app collect or share user data? **No.** (All progress is stored on-device and never leaves it.)
- Is all data encrypted in transit? Not applicable (no data transmitted).
- Can users request data deletion? Yes: clear storage or uninstall; no server-side data exists.
- Permissions: the build declares only INTERNET (added by Capacitor). It is used to load the app's own bundled
  files locally; no external requests are made.

## Release notes (first release)

First release: lessons and practice for the completed topics, spaced review, calculators and the syllabus
coverage map. More content will be added in updates.

## Before submitting

- [ ] Replace every placeholder, host the privacy policy, and confirm the descriptions match the installed build.
- [ ] Confirm which papers/topics are actually published in the bundled content and adjust "Papers covered".
- [ ] Confirm no screen shows payment, sign-in or "the pass" in the Android build.
