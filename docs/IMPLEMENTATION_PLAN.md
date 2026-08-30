# MANARA | منارة — Implementation Plan

## Purpose

This plan orders the work needed to produce the narrow MANARA prototype defined in [PRODUCT.md](./PRODUCT.md). It is a plan, not authorization to build the full application during the repository-context step.

The architectural boundaries are defined in [ARCHITECTURE.md](./ARCHITECTURE.md), and all linguistic content and classifications must follow [LINGUISTIC_RULES.md](./LINGUISTIC_RULES.md).

## Delivery rules

- Build the smallest vertical slice that proves cross-dialect transfer.
- Keep the complete journey functional in deterministic mock mode.
- Treat linguistic review as a release gate, not a polish task.
- Add infrastructure only when a phase has a concrete need for it.
- Do not make live AI a prototype dependency. Accounts, cloud persistence, analytics backends, and pronunciation scoring remain excluded; the explicitly authorized Gemini/browser-speech increment must preserve the full deterministic path.
- Keep Local Character behavior, Guide evaluation, content, learner state, and provider access separable.
- Design core UI mobile-first around 390px using focused application states, then widen the same structure intentionally for desktop competition screens.
- A phase cannot begin merely because code exists; the preceding validation gate must pass.

## Validation-command policy

The application scaffold and scripts now exist. The supported commands are `npm install`, `npm run dev`, `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`; keep this list and AGENTS.md synchronized. A passing engineering command is necessary but cannot substitute for visual, accessibility, privacy, or qualified linguistic review.

## Current implementation checkpoint

The application foundation, 39-destination travel network, direct Cairo/Abu Dhabi entry, layered scenarios, four deterministic six-beat dialogue packs, learner starting points, scenario state machine, distinct Local Characters and city-specific Local Guides, rule-driven evaluator, retry/history reducers, privacy-minimized local profile, and deterministic Fumble Map are implemented. The optional Gemini Interactions adapter and browser Arabic speech recognition/playback are now connected behind typed, cancellable boundaries. No credential, microphone, authentication, database, paid usage, or remote learner-data store is required.

This checkpoint is **structurally implemented but linguistically blocked**: all 132 authored Arabic and linguistic records remain `needs_review`, so the authoritative runtime manifest remains empty and the Guide must use review-pending/uncertainty behavior. Gemini output is forcibly `needs_review` and cannot alter that count. The four scenario queues are documented in [LINGUISTIC_REVIEW.md](./LINGUISTIC_REVIEW.md). Do not mark Phases 4–6 linguistically accepted until qualified review changes the applicable source records to `verified` with evidence and publication metadata.

## Phase 0 — Planning foundation

### Deliverables

- A concise AGENTS.md that maps contributors to the relevant documentation
- Product scope and non-goals
- Architecture, module boundaries, and data flow
- Linguistic validation and evaluation rules
- This ordered implementation plan

### Acceptance criteria

- The five planning documents exist and link to one another correctly.
- Product, architecture, linguistic, and delivery decisions do not contradict one another.
- The prototype scope names Abu Dhabi café and university scenarios, Cairo café and taxi scenarios, Casablanca as Coming Soon, the canonical transfer example, and mock-first behavior.
- No planning document presents an unverified expression as certain.
- No major application feature has been implemented during this phase.

### Validation gate

A product, engineering, design, and linguistic reviewer can each identify their source of truth and agree on the prototype boundary. Resolve contradictions before scaffolding.

## Phase 1 — Minimal application scaffold

### Deliverables

- A Next.js, React, and TypeScript application using Tailwind CSS
- Framer Motion available for purposeful transitions
- A minimal route and layout structure consistent with the architecture
- Directionality, typography, theme, and reduced-motion foundations
- A provider configuration in which mock mode is the safe default
- Only the dependencies required for the next phase

### Acceptance criteria

- A new contributor can install dependencies and open the initial experience using scripts that actually exist.
- The application can produce a production build using an existing script.
- Type checking and linting are configured and pass through existing scripts.
- The first route renders without external credentials or network-backed AI.
- Arabic text renders with correct shaping and can appear in an RTL region without reversing surrounding English UI.
- Missing live-provider configuration does not cause an error or degraded blank state.
- Exact working commands are added to AGENTS.md after the scripts exist.

### Validation gate

Validate the scaffold from a clean dependency install, confirm mock mode on a machine without service credentials, and review the resulting AGENTS.md commands. Do not add feature code until this baseline is reproducible.

## Phase 2 — Domain contracts and curated content seed

### Deliverables

- Typed domain contracts for destination, scenario, character, turn, learner utterance, Guide evaluation, retry, learned item, and insight event
- Explicit provider interfaces for conversation and Guide evaluation
- A content repository boundary independent of UI components
- Destination records for Cairo, Abu Dhabi, and Casablanca
- Four bounded draft scenario packs: Abu Dhabi café, Abu Dhabi university, Cairo café, and Cairo taxi
- A curated paired-expression record for عايز قهوة and أبغي قهوة
- An explicit verified or needs_review state on every linguistic content item
- Fixtures for reviewed, uncertain, and non-authoritative content behavior

### Acceptance criteria

- UI code cannot accidentally consume a bare dialect claim without its validation and confidence metadata.
- Casablanca is represented as Coming Soon and has no enterable prototype scenario.
- Scenario content names provenance or review notes appropriate to the rules in LINGUISTIC_RULES.md.
- needs_review content is not surfaced to a learner as an authoritative fact.
- The source and target members of the canonical expression pair remain distinct and linked by meaning.
- Conversation and evaluation providers can be replaced without changing scenario UI or learner-state contracts.
- The content seed is intentionally small; it contains no model-generated destination catalogue.

### Validation gate

Run the existing static checks and contract tests, then conduct a line-by-line linguistic review of every learner-visible Arabic string and attribution. A qualified reviewer must mark the canonical pair verified before it can support the demo.

## Phase 3 — Experience shell and travel journey

### Deliverables

- Landing experience
- Map-centered destination selection
- Available Cairo and Abu Dhabi nodes
- Visible, non-enterable Casablanca Coming Soon node
- Cinematic travel transition with reduced-motion equivalent
- Destination and scenario introductions
- Return-to-map navigation

### Acceptance criteria

- A first-time user can move from landing to any of the four available scenarios without encountering a dashboard or generic chat screen.
- Cairo and Abu Dhabi are distinguished through reviewed place, scenario, typography, color, sound, or visual treatment rather than flag-heavy navigation or cultural stereotypes.
- Casablanca cannot be entered and clearly communicates its status.
- Browser back, direct navigation, and refresh resolve to a coherent state rather than a dead end.
- Every motion sequence has a reduced-motion path and does not block core navigation.
- Arabic and English labels preserve their intended reading direction at desktop and mobile widths.

### Validation gate

Complete the journey using mouse, keyboard, and a mobile-width viewport; repeat with reduced motion and without network access to live AI. Design review must confirm the product reads as premium travel plus serious learning, not generic SaaS or tourism.

## Phase 4 — Deterministic mock conversation loop

### Deliverables

- A scenario state machine for introduction, learner turn, Local Character response, optional Guide moment, retry, continuation, completion, and exit
- Deterministic six-beat fixtures for Abu Dhabi café, Abu Dhabi university, Cairo café, and Cairo taxi
- A quick learner starting-point setup for beginner, MSA, dialect (with known variety), or heritage/partial experience that adapts support without gating travel
- Real browser speech input where supported, with honestly labelled typed and scripted deterministic fallbacks
- Separate Local Character and Guide presentation
- Happy path, communication-repair path, and no-intervention path

### Acceptance criteria

- All four scenarios can be completed from start to finish without any live provider, starting from an empty learner history and in either destination order.
- The Local Character remains in role and never becomes the grammar teacher.
- The Guide can remain silent on a successful turn and does not interrupt every learner input.
- A useful retry affects the active scenario and does not open a disconnected exercise.
- Reload and scenario exit have explicit behavior; neither silently corrupts learner progress.
- Mock fixtures are deterministic enough for product review and automated interaction coverage.
- The UI does not claim that scripted, typed, or staged input is live speech analysis.

### Validation gate

Exercise every fixture path, including early exit and retry decline. Verify that the Local Character and Guide responsibilities remain distinct in the rendered experience and in the provider contracts.

**Current status:** deterministic mechanics and content structure are implemented. Human review remains outstanding, so the reachable scenario UI must stay explicitly labelled as draft/review mode and cannot be treated as release evidence.

## Phase 5 — Cross-dialect evaluation and Guide intervention

### Deliverables

- A rule-driven evaluation layer using the reviewed taxonomy
- Selective intervention prioritization
- Cross-dialect transfer detection from content metadata and learner history
- Confidence-aware fallback behavior
- The canonical Egyptian-to-Emirati coffee transfer sequence
- Fixtures for target-natural, cross-dialect transfer, MSA or excessive formality, locally unnatural, vocabulary, grammar, and unclear classifications only where reviewed examples exist

### Acceptance criteria

- After Cairo establishes عايز قهوة in learner history, using it in the Abu Dhabi café is understood before feedback is offered.
- The Guide identifies it as a reviewed Egyptian form, presents أبغي قهوة as the reviewed locally natural Emirati alternative, offers a retry, and lets the conversation continue.
- The same Egyptian phrase in its Cairo context is not treated as a transfer error.
- Without supporting learner history, the Guide does not claim that the learner previously learned the phrase.
- Low-confidence or unsupported attribution produces the approved uncertainty response rather than a guessed label.
- One utterance can be communicated successfully even when a local-naturalness intervention is warranted.
- The intervention engine suppresses low-priority issues and presents no more than one primary action at a time.
- Pronunciation is absent from evaluation output unless a separately validated capability is introduced later.

### Validation gate

Require linguistic sign-off on every fixture and expected classification. Run existing interaction and contract tests, then manually replay the canonical sequence in both target contexts and from a profile without Cairo history.

**Current status:** the evaluator, normalized matching, history preconditions, one-retry rule, and verified-only publication checks are implemented and exercised with synthetic verified test fixtures. Production-authored variants and the transfer rule remain `needs_review` and disabled; therefore the canonical authoritative teaching moment is intentionally blocked.

## Phase 6 — Learner continuity, retry, and Fumble Map

### Deliverables

- A local prototype learner record
- Starting-point and derived support settings that do not gate direct scenario entry
- Known-Arabic entries that can preserve multiple dialect realizations of one concept
- Retry outcomes and a small set of high-value learning events
- A Fumble Map or equivalent insights view
- Clear reset and demo-restart behavior

### Acceptance criteria

- Completing the Cairo phrase moment makes that reviewed knowledge available in Abu Dhabi during the same local learner journey.
- Learning the Emirati alternative augments the concept; it does not erase the Egyptian form.
- The Fumble Map answers what worked, what transferred, what was retried, and what deserves review.
- The insights view avoids grades, false precision, dialect rankings, and raw transcript dumps.
- Only reviewed classifications appear as definitive insight labels.
- Refresh behavior matches the chosen local-persistence policy and is communicated consistently.
- Reset removes local prototype progress and restores the deterministic starting path.

### Validation gate

Test the journey in both destination orders, with and without prior Cairo history, after refresh, and after reset. Review insights for linguistic accuracy, interpretability, and consistency with the actual events.

**Current status:** the versioned profile, migration, known-concept derivation, retry events, direct-entry behavior, privacy-safe durable-event boundary, and Fumble Map/insights view are implemented. Raw learner input stays session-local and is absent from serialized events. Qualified linguistic review of named patterns remains pending, so Phase 6 is not linguistically accepted.

## Phase 7 — Consent and aggregate-learning boundary

### Deliverables

- A clear separation between personal learning state and optional aggregate contribution
- Consent copy and control suitable for review
- A local preview of minimal derived pattern events, if useful to the demo
- A no-op aggregate collector for the prototype
- Documented future event minimization, revocation, retention, cohort suppression, and access requirements

### Acceptance criteria

- Aggregate contribution is off by default and opting out does not alter the core learning experience.
- The prototype sends no learner-pattern, transcript, or audio data to a remote collector.
- No aggregate event is emitted before consent, even in a development path.
- Revoking consent immediately stops future contribution behavior.
- The planned derived event excludes raw audio, free text, contact details, and stable identity by default.
- Consent language does not call data anonymous unless that property has been established.
- Developer diagnostics and product analytics cannot bypass the same boundary.

### Validation gate

Inspect runtime network activity through the full prototype journey and verify that no learner data leaves the device. Conduct privacy and product-copy review before enabling even a future non-no-op collector.

## Phase 8 — Bilingual, accessible, and cinematic quality pass

### Deliverables

- Final destination visual system and restrained warm illumination
- Reviewed Arabic and English typography hierarchy
- Robust RTL and mixed-direction components
- Responsive refinement
- Keyboard, focus, contrast, text-scaling, and screen-reader improvements
- Motion timing and reduced-motion refinement
- Loading, empty, error, and offline-safe states

### Acceptance criteria

- No learner-facing surface resembles a generic admin dashboard, chat wrapper, lesson tree, or tourism booking page.
- Arabic glyphs, punctuation, numbers, and mixed Arabic/English strings remain readable across supported layouts.
- All interactive elements have a visible keyboard focus state and meaningful accessible name.
- Core journeys remain usable at mobile and desktop widths and at increased text size.
- Motion communicates travel or state without delaying input; reduced-motion users receive equivalent information.
- Mock mode has no broken assets, external-service spinners, or credential prompts.
- Coming Soon, uncertainty, feedback, and completion states do not rely on color alone.

### Validation gate

Perform bilingual visual review on representative mobile and desktop viewports, keyboard-only and screen-reader smoke tests, contrast and text-scaling checks, reduced-motion review, and an offline mock-mode walkthrough.

## Phase 9 — Prototype hardening and release gate

### Deliverables

- Stable end-to-end demo path from landing through Cairo, Abu Dhabi, Fumble Map, and return to map
- Deterministic demo reset
- Error containment and graceful fallback
- Reviewed content manifest
- A concise demo runbook describing only real behavior
- Updated repository guidance with all existing validation commands

### Acceptance criteria

- A new evaluator can complete the canonical journey without team narration.
- The demo requires no AI key, user account, analytics service, or hidden manual state change.
- Existing formatting, linting, type-checking, testing, and production-build validations all pass using commands recorded in AGENTS.md.
- No severe accessibility, RTL, broken-navigation, or content-validation defect remains.
- Every learner-visible dialect claim has a review state; only verified claims are authoritative.
- The default no-key path sends no conversation data to Gemini. Any configured Gemini or browser speech processing is disclosed, transient, optional, and absent from durable learner state.
- Product non-goals are still absent despite polish and demo preparation.

### Validation gate

Product, engineering, design, accessibility, privacy, and linguistic owners complete one shared release review. Any failure in linguistic accuracy, canonical transfer behavior, mock reliability, or privacy blocks prototype sign-off.

## Post-prototype MVP gates

These were originally post-prototype gates. The Gemini/browser-speech increment was explicitly authorized for the competition build while retaining the stated gates and deterministic acceptance baseline.

### Optional live conversation provider — implemented foundation

The Gemini Interactions provider is implemented behind a server-only typed interface. It keeps deterministic fallback, handles latency/quota/failure, protects the credential, validates structured output, and cannot bypass content validation or uncertainty policy. Persistent Gemini Live/realtime audio remains deferred.

**Gate:** side-by-side contract tests against mock behavior, failure and latency testing, security review, cost review, transcript and audio disclosure, and linguistic evaluation of representative outputs.

### Real speech input — implemented browser adapter

Browser Arabic speech recognition is implemented with clear listening/processing state, permission/device/silence/timeout/cancellation handling, cleanup, and equivalent typed/scripted fallbacks. Pronunciation analysis remains absent.

**Gate:** privacy and security approval plus accuracy evaluation for the supported Arabic varieties and expected acoustic conditions. Transcription does not by itself authorize pronunciation scoring.

### Remote learner accounts or persistence

Add identity and cloud synchronization only if sustained learner continuity cannot be met locally.

**Gate:** documented data model, access control, export and deletion behavior, retention, incident handling, and threat review.

### Aggregate learning-pattern service

Replace the no-op collector only after explicit consent and data-minimization requirements in PRODUCT.md are implemented.

**Gate:** legal and privacy approval, end-to-end revocation test, small-cohort suppression test, re-identification risk assessment, retention enforcement, and proof that opt-out has no product penalty.

### Additional destinations, scenarios, or dialect content

Expand through the same content contracts and review workflow. Do not generate a bulk dialect database.

**Gate:** qualified linguistic and cultural review, verified state for authoritative claims, scenario usability review, and evidence that the addition strengthens cross-dialect transfer rather than catalogue size alone.

## Definition of prototype done

The prototype is done only when all Phase 0 through Phase 9 gates pass, the canonical transfer journey works entirely in mock mode, Arabic content is reviewed, the learner can complete the loop accessibly, and no remote learner-data collection occurs.

Visual completion, a live model response, or a successful happy-path demo alone is not sufficient.
