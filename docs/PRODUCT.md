# MANARA | منارة — Product Definition

## Document purpose

This document defines what MANARA is, who it serves, the experience it must deliver, and what is deliberately outside the first build. Technical boundaries belong in [ARCHITECTURE.md](./ARCHITECTURE.md); dialect evaluation and content validation belong in [LINGUISTIC_RULES.md](./LINGUISTIC_RULES.md).

## Product promise

MANARA is an immersive, AI-powered platform for learning spoken Arabic through virtual travel across Arabic-speaking communities.

> Your Arabic doesn't restart at the border. It evolves.

The learner enters realistic local situations, speaks with a Local Character, and receives selective guidance that helps existing Arabic knowledge transfer into a new dialect and cultural context.

The differentiator is **cross-dialect transfer**. The map, cinematic travel, AI characters, and learner insights all support that learning mechanism; none of them replaces it.

## Product format and primary surface

MANARA is a **mobile-first Arabic-learning app delivered for the competition as a responsive web application / PWA**. The web delivery model is an implementation choice, not the product identity: to the learner, MANARA should feel like a polished application rather than a traditional website.

Design begins around a modern 390px smartphone viewport and then adapts deliberately to larger phones, tablets, laptops, and desktop competition-demo screens. Core journey states should favor full-screen focus, contextual overlays or bottom sheets, thumb-friendly controls, clear back behavior, and limited scrolling. Desktop uses its additional space intentionally while preserving the same application structure; it must not be a phone frame floating in an otherwise empty page.

## Goals and priority

The goals are intentionally ordered. A lower-priority goal must never weaken a higher-priority one.

1. **Teach spoken Arabic effectively.** Help learners communicate, notice useful differences, retry high-value phrases, and retain what they learn.
2. **Explain relationships between Arabic dialects and cultures.** Treat a learner's existing dialect knowledge as an asset and make local variation legible without flattening communities into stereotypes.
3. **Learn from aggregate learner patterns, with appropriate consent.** Understand common transfer points and learning difficulties only through privacy-preserving, optional patterns. Data collection and experimentation are not the product story.

## Target learner and core job

The first experience is for an adult beginner-to-intermediate learner who knows some Arabic from a course, family, travel, or another dialect and wants to communicate naturally in a new Arabic-speaking community.

Their core job is:

> When I enter a new Arabic-speaking context, help me use what I already know, understand how local speech differs, and adapt without making me feel that my previous Arabic was wrong.

The prototype does not attempt to serve advanced linguistic research, formal MSA instruction, children, test preparation, or professional interpreting.

## Product principles

### Communication before correction

The Local Character should first behave as a person in the situation. If the learner is understood, the conversation continues. The Guide intervenes at a natural pause and only when feedback is likely to improve meaning, communication, local naturalness, or a recurring pattern.

### Transfer, not reset

MANARA distinguishes a phrase transferred from another dialect from nonsense or a generic grammar error. It names the learner's prior knowledge, explains the target-context alternative, and offers a useful retry.

### Confidence before certainty

Dialect attribution is nuanced. Every linguistic item has a validation state, and uncertain attribution is never presented as fact. If classification confidence is insufficient, MANARA says:

> MANARA isn't confident enough to classify this expression.

### Curated depth before catalogue breadth

Four small, bounded situations are more valuable than a large model-generated dialect database. The implemented review set is an Abu Dhabi café, an Abu Dhabi university encounter, a Cairo café, and a Cairo taxi journey. Arabic correctness and local naturalness outrank destination count and feature count.

### Immersion with an available guide

The product should feel like travel, not a lesson dashboard. Teaching appears at the moment it is useful and then gives the scenario back to the learner.

### Mock mode is a real product path

The prototype must remain coherent and demonstrable without AI credentials, browser speech support, or network-dependent generation. The guaranteed path is deterministic, human-reviewed, and capable of showing the complete learning loop. Optional Gemini and browser voice adapters may enrich delivery but never own the learning decision. During authoring, the same deterministic path may expose clearly marked `needs_review` fixtures for internal review, but that is not a releasable teaching mode.

## Core journey

1. **Choose a starting point.** A short, skippable setup records whether the learner is a beginner, an MSA learner, a dialect learner (with a known variety when supplied), or a heritage/partial learner. It changes support, not access.
2. **Land in MANARA.** The learner understands the promise and enters a world-centered experience.
3. **Choose a destination.** Cairo and Abu Dhabi are available nodes. Casablanca is visible as a preview, while a wider set of real Arab-world cities communicates MANARA's future network without implying that lessons already exist there.
4. **Travel.** A short cinematic transition establishes place and tone; reduced-motion users receive a calm equivalent.
5. **Enter a scenario.** A concise introduction sets the situation, the learner's goal, and the Local Character.
6. **Communicate with the Local Character.** The learner speaks through browser-supported Arabic recognition, types instead, or selects a scene-safe practice response. The character stays in role and responds at the learner's selected support level; optional Gemini wording remains transient and non-authoritative.
7. **Receive selective Guide feedback.** The Guide may acknowledge success, identify a supported transfer or register contrast, ask for clarification, or stay silent.
8. **Retry when useful.** A retry changes the active turn and returns to the same character context; it is not a disconnected flashcard.
9. **Continue and complete the situation.** The scenario resolves as a social interaction, not as a sequence of corrections.
10. **Review learner insights.** The Fumble Map eventually shows a small number of meaningful patterns and dialect connections, not a grade or a transcript dump.
11. **Return to the map and travel again.** Knowledge learned in one destination remains available in the next.

Cairo-first then Abu Dhabi remains the canonical transfer demonstration, but it is not a prerequisite path. A new learner may enter Cairo or Abu Dhabi directly, and every scenario must remain coherent with an empty history. Starting-point setup controls translation, transliteration, hint timing, expected response complexity, and comparison style; it never locks a destination or scenario.

### Current deterministic review build

The four scenario packs are structurally implemented with six turns each and can be exercised without credentials, a microphone, authentication, or a database. Real browser microphone/type controls and an optional Gemini conversation layer now sit above that path. All 132 newly authored linguistic records still remain `needs_review`; Gemini output is also forcibly `needs_review`. The build therefore presents content only as clearly disclosed internal draft/review material and suppresses authoritative Guide classifications, dialect attributions, and locally natural alternatives. Engineering completion is not linguistic approval; see [LINGUISTIC_REVIEW.md](./LINGUISTIC_REVIEW.md).

## The canonical cross-dialect moment

The learner has previously learned the Egyptian Arabic phrase:

> عايز قهوة

In Abu Dhabi, the learner uses the same phrase. MANARA must not treat it as meaningless or simply wrong. The local character understands the request, and the Guide responds approximately:

> Understood ✓  
> This is natural Egyptian Arabic.  
> In Emirati Arabic, a locally natural alternative is:  
> أبغي قهوة

The learner retries with the Emirati alternative and the café interaction continues.

This moment must demonstrate five behaviors:

1. Meaning is recognized before correction.
2. The source dialect is acknowledged only when the classification is validated and sufficiently confident.
3. The target alternative is small, locally useful, and reviewed.
4. The retry stays inside the scenario.
5. The learner's known Arabic is updated rather than overwritten.

If the learner has no prior Cairo history, MANARA may still explain the reviewed dialect relationship, but it must not claim the learner previously learned or used something that is absent from their history.

## Learning model

### Known-Arabic record

MANARA maintains a compact learner record of useful expressions and concepts. Each learned item can include its meaning, dialect or register, source scenario, validation state, and the learner's latest demonstrated use. A concept may have several locally natural realizations; one does not replace the others.

### Evaluation taxonomy

The Guide works from the following product-level distinctions:

1. Natural target-dialect usage
2. Transfer from another Arabic dialect
3. MSA or excessive formality for the situation
4. Correct but locally unnatural phrasing
5. Vocabulary error
6. Grammar error
7. Unclear meaning
8. Pronunciation-related feedback only when technically defensible in a later phase

The detailed decision and validation rules are defined in [LINGUISTIC_RULES.md](./LINGUISTIC_RULES.md).

### Selective feedback policy

The Guide prioritizes feedback that:

- changes or clarifies meaning;
- removes a communication obstacle;
- strongly improves local naturalness;
- makes cross-dialect transfer visible; or
- addresses a repeated learner pattern.

Minor issues may be deferred or omitted. The Guide should normally present one actionable idea at a time. It does not interrupt every turn, list every possible correction, or turn the Local Character into a teacher.

## AI role boundaries

### Local Character

The Local Character:

- remains immersed in the active café, campus, or taxi situation;
- speaks naturally for the destination using reviewed content;
- behaves like a person rather than an evaluator;
- avoids unnecessary MSA and unsolicited grammar explanations;
- adapts response complexity to the learner; and
- keeps the interaction moving when meaning is clear.

### MANARA Guide

The Guide:

- observes without taking over the conversation;
- provides concise, actionable teaching feedback;
- identifies likely cross-dialect transfer when supported;
- distinguishes dialect use, register, and error types where defensible;
- recommends a retry only when it has learning value;
- updates learner patterns; and
- states uncertainty rather than manufacturing precision.

The two roles must be visibly and behaviorally distinct. A single generic chat response that mixes role-play, correction, and product narration does not meet the product requirement.

## Prototype scope

The competition prototype is a complete, narrow demonstration rather than a broad beta.

### Must be demonstrable

- A premium bilingual landing experience with a clear product proposition
- A map-centered destination selection experience
- Cairo, Egypt as an available destination with an Egyptian Arabic café and taxi scenario
- Abu Dhabi, UAE as an available destination with an Emirati Arabic café and university scenario
- Casablanca, Morocco as a non-enterable Coming Soon node
- Short cinematic travel and scenario-introduction transitions
- A distinct Local Character and MANARA Guide
- Deterministic mock conversations that show successful communication, selective feedback, retry, and completion
- The canonical Egyptian-to-Emirati coffee transfer moment once its source, target, and mapping are human-verified; until then, the safe uncertainty/review-pending path
- A small curated content set in which every linguistic item is marked verified or needs_review
- A learner record that carries useful knowledge between the two destinations during the prototype
- A Fumble Map that summarizes reviewed learning patterns and cross-dialect connections
- A return-to-map loop
- Strong Arabic/English hierarchy, RTL behavior, responsive layouts, keyboard access, and reduced-motion handling
- A visible mock-mode state that needs no external AI credentials and does not fail when live services are absent

### Prototype input and speech claims

The interface provides a real browser microphone action where speech recognition is supported, plus **Type instead** and scene-safe practice responses. Abu Dhabi requests `ar-AE`; Cairo requests `ar-EG`. Browser support and recognition quality vary, and browser/OS speech services may process audio outside MANARA. The product evaluates the resulting text only and makes no pronunciation, accent, or acoustic-quality claim.

When `GEMINI_API_KEY` is configured privately on the server, a bounded transcript and minimum scene context may be transmitted to Google for one short Local Character response with provider storage disabled. When the key is missing or the provider fails, the same deterministic evaluation, progress, Guide, retry, and completion path continues. Raw audio, full transcripts, and generated text are not durable learner data.

### Prototype persistence

Learner state remains local to the browser or current device. The learner chooses whether the versioned profile and minimal derived learning events persist on-device. Raw learner input is session-only and is removed before durable serialization; visiting a city never implies knowledge of that city's dialect. Account creation, cloud synchronization, and cross-device history are not required.

## First usable MVP after the prototype

The first usable MVP may extend the validated prototype with:

- further reliability evaluation of the implemented optional conversation and browser speech adapters;
- graceful fallback to reviewed mock flows when the provider is unavailable;
- a small additional set of linguistically reviewed utterance variations within the same four bounded scenarios;
- explicit transcript, audio, retention, and deletion controls if live speech is introduced;
- durable learner progress only if identity and privacy requirements justify it; and
- optional aggregate learning-pattern collection only after consent, privacy, security, and minimum-cohort behavior are implemented and reviewed.

The MVP does not earn permission to expand content by model intuition. New destinations and scenarios remain gated by content validation.

## Fumble Map and learner insights

The Fumble Map is a reflective learning surface, not a leaderboard. It should answer:

- What did I communicate successfully?
- Which phrases transferred from one dialect to another?
- What locally natural alternative did I practice?
- Which high-value pattern should I revisit?

It may visualize a route or connection between dialects, but it must not imply that dialects are cleanly bounded, rank dialects by correctness, or turn uncertainty into a precise score. In the prototype it uses local reviewed events, not hidden analytics.

The implemented experience at `/fumble-map` presents a travel-connected sequence of observations, persistent patterns, and emerging strengths. It recognizes communication success, successful retries and later reuse, repeated vocabulary/concept needs, local and formal-to-everyday adaptation, beginner progress, and optional cross-dialect patterns. Every recommendation points back to its originating insight and structured learning events, then back into an existing practice scenario.

Personalization changes emphasis rather than grading the learner: beginners see completion and communication foundations; MSA learners see register flexibility; dialect learners see local adaptation and only sufficiently trusted cross-dialect enrichment; heritage or partial learners prioritize natural communication, vocabulary, and useful adaptation. If meaningful evidence is absent, the polished empty state invites a conversation and shows no fake statistics.

Source variety is nullable and optional. Only repeated, consistent, human-verification-compatible `HIGH`-confidence evidence may support a learner-facing cross-dialect pattern. Unknown or low-confidence origin remains hidden and never blocks understanding, local feedback, scenario progression, insights, or recommendations.

## Consent-aware aggregate learning patterns

Personal learning state and aggregate product learning are separate:

- **Personal progress** is necessary to deliver transfer and insights. In the prototype it stays local.
- **Aggregate learning contribution** is optional and must never change access, feedback quality, or product status.

The prototype sends no learner-pattern data to a remote service. It may demonstrate the consent language and show a local preview of the kinds of derived patterns that could be contributed later.

Before any future collection is enabled:

- consent is explicit, informed, purpose-specific, and off by default;
- the learner can decline or revoke it without losing core functionality;
- the product explains what is collected, why, for how long, and how to withdraw;
- raw audio, raw free-text transcripts, names, contact details, and stable identity are excluded from aggregate learning by default;
- the preferred contribution is a minimal derived event, such as a reviewed feedback category, dialect pair, scenario concept, and whether a retry succeeded;
- small cohorts are suppressed and reporting does not expose individual journeys;
- retention, deletion, access control, security, and legal review are defined before launch; and
- the word anonymous is used only if the implementation has demonstrated that the data cannot reasonably be linked back to a person. Otherwise the product uses accurate terms such as de-identified or aggregated.

Aggregate insights may improve content prioritization and evaluation. They must not drive covert experiments, advertising, learner ranking, or confident dialect claims.

## Non-goals for the prototype and first MVP

MANARA is not:

- ChatGPT with a map;
- one generic chatbot per country;
- a comprehensive language course or gamified lesson tree;
- a dialect translator or dialect encyclopedia;
- an MSA grammar course;
- a large destination or scenario catalogue;
- a source of unreviewed linguistic claims;
- a pronunciation score, accent score, or native-likeness judge;
- a tourism booking or destination-information site;
- a social network, teacher marketplace, classroom dashboard, or admin suite;
- a payments, subscription, credentialing, or certification platform; or
- a learner-data collection or experimentation platform.

User accounts, cloud sync, social features, authored course tooling, comprehensive analytics infrastructure, and a live Realtime integration are deferred until the narrow learning loop is credible.

## Experience and visual quality

The experience combines a premium interactive travel atmosphere with the seriousness of a language-learning product.

It should be:

- cinematic and map-centered;
- dark and atmospheric with restrained warm illumination;
- visually quiet, with destination nodes rather than flag-heavy navigation;
- elegant in motion and calm when reduced motion is requested;
- excellent in Arabic typography, shaping, line height, and directionality;
- deliberate in Arabic/English hierarchy; and
- legible and usable across desktop and mobile.

It should not resemble a generic SaaS dashboard, Duolingo clone, basic chatbot, admin panel, or tourism landing page. Motion must explain travel, state, or focus rather than delay the learner.

After the concise introduction, it should also avoid marketing-site conventions such as permanent desktop navigation, long stacked sections, or unrelated card grids. The map and future conversation flow are application states, not sections of a landing page.

## Success definition

### Prototype success

The prototype succeeds when:

- a first-time evaluator can understand the proposition and complete the Cairo-to-Abu Dhabi loop without explanation from the team;
- the full experience works in deterministic mock mode without credentials;
- the canonical transfer example is recognized, explained accurately, retried, and reflected in learner insights;
- the Local Character stays immersive while the Guide intervenes selectively;
- Cairo and Abu Dhabi feel meaningfully distinct without relying on flags or stereotypes;
- no needs_review item is presented as a verified dialect fact;
- uncertainty is communicated honestly;
- Arabic, RTL, responsive behavior, reduced motion, and keyboard navigation pass review; and
- no learner data leaves the device in the prototype.

### Learning evidence for later pilots

Once a reviewed pilot and appropriate consent are available, success should be evaluated through:

- scenario communication completion;
- successful use of a locally natural alternative on retry;
- later recall or recognition of the dialect relationship;
- the rate and perceived usefulness of Guide interventions;
- recurrence of high-value patterns over time; and
- qualitative learner trust, confidence, and cultural respect.

These signals are subordinate to linguistic quality and privacy guardrails. No numeric learning claim should be published before an evaluation design, baseline, and sample are defined.

## Decision rule for new features

A proposed feature belongs in the current product only if it materially improves at least one of these:

1. in-scenario communication;
2. cross-dialect transfer;
3. selective, accurate feedback;
4. retention of reviewed learning; or
5. the quality and trustworthiness of the travel-learning experience.

If it does not, it should be deferred even if it is visually impressive or technically novel.
