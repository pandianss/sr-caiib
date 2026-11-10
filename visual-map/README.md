# Visual syllabus coverage map

Open `coverage-map.html` directly in a modern browser after extracting the ZIP. The file includes its styles, map data and interaction logic; it does not need a server, a package installation or a connection to NotebookLM. Select a paper, expand a module, then expand a named section for its exact syllabus scope and PDF page locator.

## What the map represents

- Source: the supplied `caiib syllabus.pdf`, headed **CAIIB- ELECTIVE SUBJECTS — Rules & Syllabus 2025**. It contains 17 PDF pages; the mapped syllabus is on PDF pages 4–13.
- Five electives are mapped: Rural Banking, Human Resources Management, Information Technology & Digital Banking, Risk Management and Central Banking.
- The map contains 25 lettered modules, two appendices, 123 named sections and one editorial container for the unheaded Central Banking appendix topic list.
- The four compulsory papers have no source in this booklet. Their nodes remain visible with unknown module/topic denominators.
- Page numbers are one-based PDF positions, not invented printed page numbers. The source fingerprint and transcription notes are in `source-data.json`.

## Coverage and authorship

Source structure is not authored learning content. No lessons, assessments or actual review records have been linked to this map. The JSON's status describes linkage to this map, not the existence of material elsewhere in the user's app or notebook. The map is currently read-only and does not save completion ticks or change the evidence ledger.

Retained syllabus labels and scope phrases are internal curriculum metadata. They are not learner-facing textbook passages, original lessons or a generated question bank. All educational content must still be independently authored and reviewed under the kit's content-pipeline requirements.

The section count is not a verified count of atomic learning objectives. Comma-separated scope lists remain intact; review and decompose them into assessable objectives without dropping qualifications or changing the official scope. No full-syllabus completion percentage is shown while compulsory sources and objective mapping are missing.

## Source limitations

The title says 2025. A later PDF creation date is not proof of a newer syllabus edition. The booklet describes elective certificate examinations for existing CAIIB holders; do not transfer its eligibility, fees or passing rules to regular CAIIB without the relevant source. The cutoff-date paragraph and example table use different exam-month ranges, so this map deliberately does not infer an operational exam cutoff.

## Updating or integrating the map

`source-data.json` is a planning/transcription record, not a `CurriculumCatalogue`, staging batch or published content pack. Do not feed it directly to the importer. Reconcile official headings and listed scope, add the missing compulsory sources, derive reviewed objectives, then use the existing coverage ledger and explicit import configuration.

The standalone map embeds a compact copy of this source data. Editing the JSON alone will not alter the displayed map: regenerate the embedded data at the same time. Preserve stable paper/module/section IDs and their exact source locators. Missing or unverified material must stay visible rather than being silently counted as complete.
