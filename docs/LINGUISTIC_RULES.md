# MANARA Linguistic Rules

This document is the normative policy for dialect content, learner-language evaluation, and linguistic feedback in MANARA | منارة. It applies to authored content, mock responses, prompts, fixtures, analytics-derived suggestions, and future live-AI integrations.

The core invariant is:

> MANARA may understand broadly, but it may teach only what it can support.

In this document, **must** and **must not** are release requirements; **should** is the default unless a reviewed exception is recorded.

## 1. Prototype linguistic scope

The first release is deliberately small:

- Cairo, Egypt — Egyptian Arabic — casual café interaction.
- Cairo, Egypt — Egyptian Arabic — short taxi/transport interaction.
- Abu Dhabi, UAE — Emirati Arabic — casual café interaction.
- Abu Dhabi, UAE — Emirati Arabic — short university peer interaction.
- Casablanca, Morocco — **Coming Soon** presentation only; it must not ship teachable Moroccan Arabic content yet.
- MSA is recognized only where needed to distinguish a valid but contextually formal expression from target-dialect speech.

Content should cover the finite intents and recovery paths in these four situations well, not attempt general dialect coverage. Every expression, contrast, correction, and cultural or register claim must be tied to a specific scenario, locality, communicative intent, and validation record.

The codebase currently contains four structurally complete deterministic dialogue packs for internal review. Their Arabic, transliterations, meanings, variety/register labels, and teaching relations remain `needs_review`; this engineering checkpoint is not a linguistic release. They may be exercised only in a conspicuously labelled draft/review mode, and must not enter the authoritative teaching manifest or drive a definitive Guide claim. The complete review queue is [LINGUISTIC_REVIEW.md](./LINGUISTIC_REVIEW.md).

Success is not the number of phrases in the dataset. Success is reliable instruction within the declared scope.

## 2. Small, curated data policy

1. Add content only when it supports a named prototype scenario, a required recovery path, or a reviewed cross-dialect contrast.
2. Prefer one well-evidenced expression with bounded variants over many generated paraphrases.
3. Do not add a destination, general-purpose lexicon, or broad dialect rule set until the current scenario passes the release gates in this document.
4. Every new linguistic record starts as `needs_review`, regardless of whether it was written by a human, proposed by a model, found in a source, or observed in learner data.
5. Only `verified` records may appear as authoritative teaching content. Release tooling must exclude `needs_review` records from runtime teaching bundles by construction.
6. A phrase absent from the curated dataset is **unknown to MANARA**, not wrong, unnatural, or foreign. This is a critical closed-world limitation.
7. Learner utterances and aggregate patterns may suggest review candidates, but they must never promote content or create rules automatically.
8. Generated or synthetic variants are allowed only as authoring leads. Each remains `needs_review` until the full evidence and review workflow is complete.

### Prohibited shortcuts

MANARA must not:

- generate or backfill a dialect database from model intuition;
- treat one model's confidence, several models' agreement, self-consistency, translation, or back-translation as linguistic evidence;
- use ASR output, search snippets, unsourced social posts, or learner frequency alone as proof of dialect, locality, register, or naturalness;
- batch-convert MSA or one dialect into another and publish the output;
- treat a country as a single homogeneous dialect or infer usage from a flag or country label;
- claim that an expression is unnatural merely because it has no matching record;
- infer a learner's dialect knowledge from nationality, ethnicity, name, or location;
- describe a form as what “everyone” or “no one” says without evidence supporting that scope;
- expose draft content by asking a live model to improvise a local alternative at runtime.

LLMs may help organize evidence, draft non-authoritative copy, or propose candidates for human review. LLM output is never an evidence source or a substitute for a qualified reviewer.

## 3. Validation states

Each independently surfaced linguistic claim has exactly one content-validation state:

| State | Meaning | Runtime use |
|---|---|---|
| `needs_review` | Evidence or review is incomplete, disputed, stale after a material change, or outside the approved context. This is the default. | May be used in internal authoring and review tools only. It must not drive a learner-facing classification, correction, local alternative, or cultural claim. |
| `verified` | The claim, its wording, meaning, locality, register, scenario bounds, evidence, and current version have completed human review. | May be used only within its reviewed bounds. It can still produce an uncertain runtime match. |

Validation attaches to a **versioned claim in context**, not to an Arabic string forever. Changing the Arabic, gloss, dialect attribution, locality, register, naturalness judgment, transfer relationship, or explanation resets the affected claim to `needs_review`.

If a verified claim is challenged, disable it from release and return it to `needs_review` while preserving the audit history. Do not leave a disputed claim active because it was previously approved.

### Content state is not classifier confidence

These are separate controls:

- **Content-validation state** asks: “Is this teaching claim supported?”
- **Runtime confidence** asks: “Does this learner input match that supported claim here?”

High runtime confidence cannot authorize `needs_review` content. Conversely, `verified` content does not justify a confident classification when the input, intent, transcript, or context is ambiguous.

## 4. Evidence and review workflow

### 4.1 Minimum evidence bundle

A candidate must record:

- the exact claim being made, including Arabic surface form and English meaning or explanation;
- variety and locality at an appropriate level, such as Egyptian Arabic in Cairo or Emirati Arabic in Abu Dhabi—not country alone;
- scenario, speech act, relationship, register, and any speaker or audience constraints relevant to the judgment;
- at least one traceable evidence item with a stable locator, access or observation date, and enough context to review it;
- reviewer identity or stable reviewer ID, relevant language/community competence, decision, date, and notes;
- a corroborant independent of the author: either a second qualified reviewer or a suitable published, recorded, or curated source;
- known variation, disagreement, limitations, and contexts where the claim should not be applied.

Suitable evidence may include contextualized natural speech from a consented recording or curated corpus, a reputable dialect reference, or structured elicitation with a qualified community reviewer. A reviewer attestation must state the locality, context, and judgment; “a native speaker said so” is not an adequate record by itself.

Cross-dialect mappings require competence on both sides. The Egyptian-to-Emirati café demonstration must be reviewed for the Egyptian source claim, the intended meaning, the Emirati target alternative, and the appropriateness of the contrast in a casual Abu Dhabi café. This normally requires reviewers covering each community, unless one reviewer demonstrably covers both.

### 4.2 Workflow

1. **Propose:** identify the scenario need and create a narrowly worded record as `needs_review`.
2. **Collect evidence:** attach contextual evidence; do not strip away pragmatic, geographic, or register information.
3. **Review:** a qualified human checks the Arabic, intended meaning, naturalness, attribution, bounds, learner explanation, and proposed classification.
4. **Corroborate:** add an independent reviewer or suitable external source. Record disagreements instead of resolving them by majority vote or model opinion.
5. **Adjudicate:** narrow the claim when evidence supports only a narrower locality, speaker group, register, or meaning. If material disagreement remains, keep `needs_review` and exclude it.
6. **Test:** add or update positive, negative, ambiguity, and non-interruption fixtures.
7. **Approve:** record the reviewed version and change its state to `verified` only after the evidence and tests are complete.
8. **Publish:** build the runtime content manifest from verified records only and retain traceability from surfaced feedback to record, evidence, and review.

Review is reopened after a material content edit, credible community challenge, evidence conflict, scope expansion, or classifier change that alters how the claim is applied.

Review decisions may use `HUMAN_VERIFIED` in editorial sign-off records to make the human authority explicit. The canonical source value remains the lowercase `validationStatus: "verified"`; tooling, tests, or models must never write that state merely because an editorial checklist exists. Only a qualified reviewer with relevant native/community competence may authorize the transition, and the evidence, reviewer IDs, reviewed version/date, bounds, and publication decision must be recorded together.

## 5. Evaluation taxonomy

The Guide uses exactly these eight pedagogical classifications. Internal pipeline states such as `no_match`, `transcript_uncertain`, or `feedback_suppressed` are not learner-error classifications.

| ID | Classification | Required interpretation | Default learner action |
|---|---|---|---|
| `natural_target_usage` | Natural target-dialect usage | The intent and form fit a verified target-variety pattern for the current locality, scenario, and register. A normalized match alone is insufficient if pragmatics differ. | Continue the conversation. Do not praise or explain every successful turn. |
| `cross_dialect_transfer` | Transfer from another Arabic dialect | The form and meaning fit a verified non-target variety, a reviewed target alternative exists, and learner history supports prior exposure or use. It is understood as transferable knowledge—not meaningless and not automatically a grammar or vocabulary error. | Acknowledge understanding, name the source variety within evidence bounds, offer one local alternative, and invite at most one useful retry. |
| `msa_or_excessive_formality` | MSA / excessive formality for context | The utterance is valid or intelligible MSA or a reviewed formal register choice, but is noticeably formal for this specific social setting. MSA is not an error. | Confirm that it works, explain the register distinction, and offer a verified local alternative if pedagogically useful. |
| `correct_but_locally_unnatural` | Correct but locally unnatural phrasing | Meaning and structure are acceptable, but evidence shows the expression is not a conventional choice in the reviewed target context. Absence from the dataset can never trigger this label. | Preserve the learner's success, then offer a more locally natural verified choice without saying the original is grammatically wrong. |
| `vocabulary_error` | Vocabulary error | A word choice conflicts with the supported intended meaning or context and is not better explained by dialect transfer, MSA, or documented variation. | Correct only the consequential word or phrase and keep the explanation brief. |
| `grammar_error` | Grammar error | A structural pattern interferes with, changes, or repeatedly weakens the intended message, and is not a documented target/source-dialect pattern or acceptable variation. | Correct the smallest useful unit; avoid an unsolicited grammar lecture. |
| `unclear_meaning` | Unclear meaning | The system cannot resolve the intended meaning reliably from the available text/audio and context. This describes MANARA's uncertainty, not learner failure. | Ask a natural clarifying question or use the standard uncertainty message. Do not invent a correction. |
| `pronunciation_issue` | Pronunciation-related feedback | A narrowly defined, technically validated acoustic feature materially affects intelligibility and passes the pronunciation gates in Section 9. A transcript mismatch alone is not pronunciation evidence. | Give bounded, feature-specific guidance only when enabled; otherwise emit no pronunciation classification. |

### 5.1 Classification rules

- A learner turn can create several internal candidates, but the Guide presents at most one primary teaching point per turn.
- `cross_dialect_transfer` takes precedence over `vocabulary_error` or `grammar_error` when the same feature is verified usage in the source dialect.
- `msa_or_excessive_formality` takes precedence over `correct_but_locally_unnatural` when formality is the supported explanation.
- `natural_target_usage` is used only when there is no higher-value correction; it normally produces no Guide interruption.
- `unclear_meaning` is preferred to a guessed linguistic label.
- `pronunciation_issue` is evaluated separately from transcript-based categories and is disabled for the initial prototype.
- Multiple distinct issues are ranked by communication impact, meaning impact, recurrence, pedagogical value, and evidence confidence. Lower-ranked issues are suppressed or deferred, not stacked into a correction list.
- A valid expression may belong to several Arabic varieties. Do not force an exclusive attribution where the evidence supports shared or ambiguous usage.

## 6. Uncertainty and learner-facing language

When MANARA lacks sufficient evidence or runtime confidence, use:

> MANARA isn't confident enough to classify this expression.

The Arabic localization of this sentence must receive the same review as other authored Arabic copy before release.

When intent is still recoverable, the Local Character may continue naturally or ask a short clarifying question. The Guide must not fill the evidence gap with a guessed dialect label, invented local alternative, or categorical “wrong.” It may use bounded wording such as “This may be…” only when the possibilities themselves are verified and the uncertainty is useful to the learner.

Uncertainty must not be hidden behind a precise percentage unless the relevant confidence measure has been calibrated and the percentage is meaningful to learners. Internal confidence values are diagnostic, not linguistic proof.

## 7. Cross-dialect transfer

Cross-dialect transfer is MANARA's central teaching behavior. It is a relationship among:

1. a demonstrated or explicitly learned source-variety expression;
2. the learner's intended meaning;
3. the current target locality, scenario, and register; and
4. a verified target-variety alternative or equivalence note.

A transfer rule must link versioned source and target records. It must not be inferred from superficial spelling similarity, machine translation, or a broad dialect stereotype. Learner history should distinguish exposure, successful use, correction, and demonstrated mastery. Never infer transfer from demographic identity.

### 7.1 Canonical Cairo-to-Abu Dhabi demonstration

Preconditions:

- The learner previously learned or successfully used the verified Egyptian expression <span dir="rtl" lang="ar">عايز قهوة</span> for the relevant café intent.
- The learner is now in the casual Abu Dhabi café scenario.
- The transcript and intent are sufficiently clear.
- The source expression, transfer mapping, and Emirati alternative have all reached `verified`.

Learner says:

> <span dir="rtl" lang="ar">عايز قهوة</span>

Expected classification: `cross_dialect_transfer`, not `grammar_error`, `vocabulary_error`, or `unclear_meaning`.

The Guide response should be concise and approximately:

> Understood ✓  
> This is natural Egyptian Arabic.  
> In Emirati Arabic, a locally natural alternative is:  
> <span dir="rtl" lang="ar">أبغي قهوة</span>

The learner may retry once and then the conversation continues. The Local Character remains in role. If the prerequisite review or runtime match is missing, MANARA uses the uncertainty policy instead of improvising the contrast.

This product-mandated example is not exempt from validation: it is a release-blocking fixture and must be supported by reviewed evidence on both sides.

### 7.2 Transfer boundaries

- Explain the reusable difference, not just a one-off translation, when a verified pattern supports it.
- Do not imply that the target alternative is the only acceptable form.
- Preserve semantic and pragmatic differences; “approximately equivalent here” is preferable when equivalence is context-limited.
- Do not convert every non-target form into a correction. If it is understood and adaptation has low instructional value, allow the conversation to flow.
- Record cross-dialect relationships item by item. One verified contrast does not license general claims about Egyptian, Emirati, Gulf, or “Arabic” as a whole.

## 8. MSA and register distinctions

MSA is a valid Arabic variety and must never be presented as defective Arabic. A classification of `msa_or_excessive_formality` requires evidence for both the form and its social effect in the current context.

- Distinguish “valid but formal here” from “incorrect.”
- Do not call a form MSA solely because it is shared across regions, appears in formal writing, resembles a dictionary entry, or is absent from the target list.
- Account for code-switching and forms shared by MSA and dialects. If attribution is ambiguous, do not force the MSA label.
- Bind register claims to scenario, relationship, speech act, and locality. A form can be natural in one setting and marked in another.
- Offer a target-dialect alternative only when that alternative is verified for the same intent and context.
- Avoid simplistic “MSA versus dialect” explanations when the evidence reflects a continuum, a shared form, or speaker variation.

## 9. Pronunciation limits

`pronunciation_issue` is reserved for later work and must be disabled in the initial prototype. Speech recognition or a text transcript can support conversation, but neither can justify claims about pronunciation quality by itself.

MANARA must not ship:

- accent or “native-likeness” scores;
- unvalidated pronunciation percentages;
- claims about a phoneme based only on an ASR substitution;
- feedback that confuses microphone quality, noise, latency, or ASR bias with learner performance;
- broad judgments such as “bad pronunciation” or “wrong accent.”

Pronunciation feedback may be enabled only after a separate release review establishes:

1. a narrow, teachable feature definition and its target-variety bounds;
2. consented, human-labeled benchmark audio with qualified adjudication;
3. documented performance and false-positive acceptance thresholds approved before testing;
4. evaluation across relevant devices, noise conditions, speaker profiles, and proficiency levels;
5. a way to separate low-quality audio and uncertain recognition from likely learner production;
6. bounded learner copy, an uncertainty path, and an option to continue without retrying; and
7. privacy, retention, and consent behavior consistent with the product's data policy.

Until all gates pass, audio-derived learner insights must describe observable interaction outcomes, such as “MANARA needed clarification,” rather than asserting a pronunciation defect.

## 10. Feedback priority and interruption policy

Communication comes first. The Local Character behaves like a person in the scene; the Guide teaches selectively.

| Priority | Condition | Behavior |
|---|---|---|
| P0 — communication blocked | Intent cannot be recovered or the scene cannot continue safely and coherently. | The Local Character asks a natural clarification. The Guide may add one concise prompt if verified help is available. |
| P1 — meaning at risk | A verified issue changes the intended meaning or is likely to produce a materially different outcome. | Give the highest-value correction after the character's natural response and offer one retry. |
| P2 — transfer / strong local naturalness / recurring pattern | Communication succeeds, but a verified transfer contrast, salient local choice, or recurring pattern has high teaching value. | Give one brief post-turn Guide intervention; retry is optional. |
| P3 — minor variation or style | Meaning and interaction are intact, and the issue has low immediate value. | Do not interrupt. It may be logged only if verified and pedagogically useful when recurring. |

Additional rules:

- Present no more than one Guide teaching point for a learner turn.
- Prompt no more than one retry for the same issue in an exchange; never trap the learner in a retry loop.
- If several issues compete, prioritize communication and meaning, then a recurring verified pattern, then strong local naturalness. Suppress cosmetic corrections.
- For the prototype, “recurring” means the same verified rule ID occurs on at least two distinct learner turns. A prompted retry does not count as a new occurrence.
- A recurrence can raise priority but cannot make an unverified diagnosis publishable.
- The learner can skip a retry. The scenario must remain playable.
- The Local Character may naturally signal misunderstanding but must not become a grammar teacher, list classifications, or unnecessarily switch to MSA.
- The Fumble Map must distinguish `observed_once`, `recurring`, `improving`, and `uncertain`; only verified classifications count toward a named linguistic pattern.

## 11. Arabic, bilingual, and RTL conventions

### 11.1 Content storage and matching

- Store authored Arabic as Unicode Arabic, not transliteration. Normalize stored text to NFC.
- Preserve the reviewed display form exactly. Matching normalization must be a separate, documented field or pipeline.
- Matching may normalize whitespace, tatweel, and optional diacritics when the rule explicitly permits it. Do not silently collapse hamza forms, <span dir="rtl" lang="ar">ة/ه</span>, <span dir="rtl" lang="ar">ي/ى</span>, or other meaningful distinctions without reviewed rule-level justification.
- Keep the learner's original input available for display and diagnosis; never replace it with the normalized key.
- Treat ASR transcript uncertainty as input uncertainty. Do not evaluate a suspected transcript error as a learner error.
- Transliteration, if offered, is secondary, uses a named consistent scheme, and is reviewed alongside the Arabic. Arabizi must not be the canonical content form.

### 11.2 Rendering and copy

- Authored Arabic containers use `lang="ar"` and `dir="rtl"`; English uses the appropriate LTR language context.
- Mixed Arabic/English text, numbers, punctuation, icons, and variables must use directionally isolated components. Do not rely on visual ordering in source strings.
- User-entered text should use automatic direction detection while preserving the raw text.
- Localize complete sentences rather than concatenating fragments whose order breaks in RTL.
- Mirror spatial layout where appropriate, but do not blindly mirror media controls, maps, brand marks, or universally directional symbols.
- Review line wrapping, punctuation, numerals, font shaping, cursor behavior, selection, and screen-reader reading order on narrow and wide layouts.
- An English gloss communicates meaning and pragmatics; it is not presumed to be a word-for-word equivalence.
- Arabic and English Guide copy must have equivalent certainty and tone. Translation must not turn “may be” into a categorical claim.

## 12. Linguistic data schema expectations

The implementation may choose files or a database later, but the logical schema must preserve the following entities and fields.

### 12.1 Expression claim

- stable `id` and integer `version`;
- reviewed Arabic `surface_ar` and optional reviewed display variants;
- separate `match_forms` or normalization-rule references;
- English meaning/gloss plus a stable communicative-intent ID;
- Arabic variety ID, locality, country, and community scope where relevant;
- scenario, social relationship, speech act, register, and pragmatic notes;
- accepted variation and explicit non-applicable contexts;
- eligible taxonomy classifications and learner-facing explanation keys;
- `validation_state` (`verified` or `needs_review`);
- evidence IDs, review decision IDs, author, timestamps, and change rationale;
- enabled/disabled release status independent of validation history.

Country must never be the only dialect locator. Free-text dialect names should not be used as join keys.

### 12.2 Transfer rule

- stable ID and version;
- source expression/variety and target expression/variety IDs;
- equivalent communicative intent and any semantic or pragmatic limitations;
- target locality, scenario, register, and learner-history preconditions;
- explanation copy keys and retry recommendation;
- its own validation state, evidence, and reviews—verification is not inherited merely because both expressions are verified.

### 12.3 Evidence and review records

Evidence records include type, stable locator, contextual excerpt or time/page locator, provenance, access/observation date, consent constraints where applicable, and notes. Review decisions include reviewer ID, declared competence, decision, date, reviewed version, limitations, and conflict/adjudication notes.

Do not place sensitive learner audio, transcripts, names, or contact details inside linguistic content records. Analytics references must use privacy-preserving aggregates or approved opaque IDs and remain candidate evidence only.

### 12.4 Evaluation result

Each evaluated turn should retain:

- scenario and target-variety context;
- learner-history facts actually used;
- raw input reference, input mode, transcript, and transcript-confidence state;
- matched verified record/rule IDs and versions;
- candidate classifications with runtime confidence and suppression reason;
- selected primary classification, priority, interruption decision, and retry decision;
- uncertainty or fallback reason;
- Guide copy key shown to the learner.

This trace makes a classification auditable without storing more learner data than the product permits.

## 13. Test fixtures

Fixtures are curated linguistic content and follow the same validation workflow. Each fixture must contain a stable ID, description, target locale/scenario/register, learner-history setup, exact text or approved audio reference, input/transcript confidence, expected and forbidden classifications, expected priority/interruption/retry behavior, referenced claim versions, validation state, and reviewer IDs.

The initial suite must include at least:

1. **Canonical transfer:** <span dir="rtl" lang="ar">عايز قهوة</span> after verified Egyptian learning, in the Abu Dhabi café, yields `cross_dialect_transfer`; the verified alternative is <span dir="rtl" lang="ar">أبغي قهوة</span>; grammar/vocabulary-error labels are forbidden.
2. **Target-natural control:** a verified Emirati café request in Abu Dhabi yields `natural_target_usage` and no Guide interruption.
3. **Source-context control:** the relevant verified Egyptian expression in the Cairo café is treated as target-natural, not transfer.
4. **Learner-history boundary:** source-dialect attribution is not personalized when prior exposure/use is absent; the system either uses bounded non-personal wording or the uncertainty path.
5. **MSA/register:** a reviewed MSA café expression is acknowledged as valid but formal in the reviewed casual context; it is not labeled grammar or vocabulary error.
6. **Locally unnatural versus unknown:** a positively evidenced unnaturalness fixture receives that label, while an unmatched expression receives no negative judgment merely for being absent.
7. **Vocabulary and grammar minimal pairs:** reviewed pairs demonstrate meaning-changing word choice and structure, including forbidden transfer labels.
8. **Unclear input:** ambiguous intent or low transcript confidence triggers clarification or the exact uncertainty message, with no invented alternative.
9. **Selection and interruption:** a turn with multiple verified candidates exposes only the highest-priority teaching point; minor issues are suppressed.
10. **Recurrence:** one occurrence does not create a recurring Fumble Map pattern; a second distinct occurrence of the same verified rule does; retries do not increment it.
11. **Pronunciation off:** audio or transcript differences cannot emit `pronunciation_issue` while the feature gate is disabled.
12. **Bidirectional text:** Arabic/English, numbers, punctuation, variables, and icons render and are read in the intended order on narrow and wide layouts.
13. **Normalization boundaries:** allowed diacritic/tatweel variation matches without changing display, while unapproved letter conflations do not match.
14. **Draft exclusion:** a high-confidence match to `needs_review` content cannot produce learner-facing teaching feedback.

For every positive classification fixture, add a nearby negative or ambiguity fixture. Tests must assert not only what MANARA says, but what it must not claim.

## 14. Linguistic release gates

A prototype release is blocked unless all of the following pass:

- **Scope gate:** only individually approved content from the Abu Dhabi café, Abu Dhabi university, Cairo café, and Cairo taxi packs is teachable; Casablanca remains Coming Soon. A structurally reachable draft pack is not approved content.
- **Integrity gate:** the learner-facing content manifest contains zero `needs_review` records and no runtime path can improvise an unverified dialect claim.
- **Traceability gate:** every classification, correction, dialect attribution, local alternative, MSA/register statement, and Arabic teaching string resolves to a verified version, evidence bundle, and review decision.
- **Canonical-transfer gate:** the Egyptian-to-Emirati café example is verified on both sides and passes its positive, source-context, learner-history, and uncertainty fixtures.
- **Taxonomy gate:** all eight categories have defined handling; all text-enabled categories have positive, negative, and ambiguity coverage. Pronunciation remains feature-gated off.
- **Selective-feedback gate:** priority, one-point-per-turn, retry-limit, and recurrence tests pass.
- **Unknown-input gate:** out-of-dataset and low-confidence inputs do not become categorical error or dialect claims.
- **Arabic/RTL gate:** qualified Arabic copy review and visual/accessibility QA pass for Arabic, English, and mixed-direction layouts.
- **Human scenario gate:** reviewers competent in the relevant varieties walk every reachable branch in all four scenarios and approve the language, register, tone, relationship and gender bounds, recovery behavior, and Guide restraint.
- **Change-control gate:** a content diff identifies all changed claim versions, review resets, fixture changes, and the exact verified manifest proposed for release.
- **Pronunciation gate:** the prototype makes no pronunciation-scoring claim. Any future enablement must separately satisfy Section 9.

Feature count, demo deadlines, model confidence, or polished visuals cannot waive a linguistic release gate. If verified coverage is insufficient, reduce the reachable scenario or use a transparent uncertainty/recovery path; do not fill the gap with model-intuited Arabic.

## 15. Definition of linguistically done

A linguistic feature is done only when its scope is bounded, all learner-facing claims are verified and traceable, uncertainty behavior is explicit, positive and negative fixtures pass, Arabic/English/RTL copy is reviewed, interruptions remain selective, and no runtime path can substitute generated dialect intuition for curated evidence.
