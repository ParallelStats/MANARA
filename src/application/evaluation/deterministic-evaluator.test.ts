import { describe, expect, it } from "vitest";

import {
  evaluateLearnerTurn,
  isPublishableLinguisticRecord,
  type DeterministicEvaluatorContent,
  type EvaluateLearnerTurnInput,
} from "@/application/evaluation/deterministic-evaluator";
import type {
  CrossDialectTransferRule,
  DialectVariant,
  ReviewMetadata,
} from "@/domain/content/types";
import type { LearnerProfile } from "@/domain/learning/types";

const completeVerifiedReview = {
  validationStatus: "verified",
  version: 1,
  evidenceIds: ["evidence-synthetic-policy-fixture"],
  reviewerIds: ["reviewer-synthetic-policy-fixture"],
  reviewedAt: "2026-08-29T00:00:00.000Z",
  reviewNotes: "Abstract policy fixture; it makes no Arabic linguistic claim.",
} as const satisfies ReviewMetadata;

function createVariant(
  overrides: Partial<DialectVariant> & Pick<DialectVariant, "id" | "surfaceAr">,
): DialectVariant {
  return {
    ...completeVerifiedReview,
    conceptId: "concept-request",
    dialectId: "dialect-target",
    matchForms: [],
    glossEn: "Synthetic request form.",
    register: "casual",
    communicativeIntent: "request_item",
    locality: "Synthetic locality",
    linguisticNotes: "Abstract test-only token.",
    reviewerNote: "Not learner-facing Arabic.",
    scenarioIds: ["scenario-target"],
    publicationStatus: "enabled",
    ...overrides,
  };
}

function createTransferRule(
  overrides: Partial<CrossDialectTransferRule> = {},
): CrossDialectTransferRule {
  return {
    ...completeVerifiedReview,
    id: "transfer-source-to-target",
    conceptId: "concept-request",
    sourceVariantId: "variant-source",
    targetVariantId: "variant-target",
    targetScenarioIds: ["scenario-target"],
    explanationKey: "guide.transfer.synthetic",
    reviewerNote: "Abstract test-only relationship.",
    publicationStatus: "enabled",
    ...overrides,
  };
}

function createProfile(
  overrides: Partial<LearnerProfile> = {},
): LearnerProfile {
  return {
    schemaVersion: 2,
    id: "local-prototype",
    onboardingStatus: "configured",
    startingPoint: { kind: "beginner" },
    support: {
      translation: "always",
      transliteration: "available",
      phraseHints: "proactive",
      vocabularyPreview: true,
      expectedResponseComplexity: "modeled_phrase",
      correctionDepth: "minimal",
      comparisonMode: "none",
    },
    preferredLocale: "en",
    knownConcepts: [],
    learningEvents: [],
    persistOnDevice: true,
    updatedAt: "2026-08-29T00:00:00.000Z",
    ...overrides,
  };
}

const sourceVariant = createVariant({
  id: "variant-source",
  surfaceAr: "SOURCE FORM",
  dialectId: "dialect-source",
  scenarioIds: ["scenario-source"],
});

const targetVariant = createVariant({
  id: "variant-target",
  surfaceAr: "TARGET FORM",
  matchForms: ["TARGET   FORM"],
});

const formalVariant = createVariant({
  id: "variant-formal",
  surfaceAr: "FORMAL FORM",
  dialectId: "register-msa",
  register: "formal",
});

const content = {
  variants: [sourceVariant, targetVariant, formalVariant],
  transferRules: [createTransferRule()],
} as const satisfies DeterministicEvaluatorContent;

function createInput(
  overrides: Partial<EvaluateLearnerTurnInput> = {},
): EvaluateLearnerTurnInput {
  return {
    evaluationId: "evaluation-1",
    turnId: "turn-1",
    scenarioId: "scenario-target",
    targetDialectId: "dialect-target",
    inputMode: "text",
    learnerInput: "TARGET FORM",
    learnerProfile: createProfile(),
    ...overrides,
  };
}

describe("publishable linguistic record gate", () => {
  it("requires verified, enabled, versioned content with complete review metadata", () => {
    expect(isPublishableLinguisticRecord(targetVariant)).toBe(true);
    expect(
      isPublishableLinguisticRecord({
        ...targetVariant,
        validationStatus: "needs_review",
      }),
    ).toBe(false);
    expect(
      isPublishableLinguisticRecord({
        ...targetVariant,
        publicationStatus: "disabled",
      }),
    ).toBe(false);
    expect(
      isPublishableLinguisticRecord({ ...targetVariant, evidenceIds: [] }),
    ).toBe(false);
    expect(
      isPublishableLinguisticRecord({ ...targetVariant, reviewerIds: [] }),
    ).toBe(false);
    expect(
      isPublishableLinguisticRecord({ ...targetVariant, reviewedAt: "" }),
    ).toBe(false);
  });
});

describe("deterministic learner-turn evaluator", () => {
  it("recognizes a reviewed target-context form without interrupting", () => {
    const result = evaluateLearnerTurn(
      content,
      createInput({ learnerInput: "  TARGET   FORM  " }),
    );

    expect(result).toMatchObject({
      understood: true,
      category: "natural_target_usage",
      normalizedInput: "TARGET FORM",
      naturalAlternative: null,
      intervention: "none",
      retryRecommended: false,
      validationStatus: "verified",
    });
    expect(result.candidates).toHaveLength(1);
    expect(result.primaryCandidate).toBe(result.candidates[0]);
  });

  it("treats the source form as target-natural in its own reviewed context", () => {
    const result = evaluateLearnerTurn(
      content,
      createInput({
        scenarioId: "scenario-source",
        targetDialectId: "dialect-source",
        learnerInput: "SOURCE FORM",
      }),
    );

    expect(result.category).toBe("natural_target_usage");
    expect(result.likelySourceDialectId).toBeUndefined();
    expect(result.intervention).toBe("none");
  });

  it("identifies a history-backed reviewed transfer and offers one retry", () => {
    const profile = createProfile({
      knownConcepts: [
        {
          conceptId: "concept-request",
          variantIds: ["variant-source"],
          state: "used",
        },
      ],
    });
    const firstAttempt = evaluateLearnerTurn(
      content,
      createInput({ learnerInput: "SOURCE FORM", learnerProfile: profile }),
    );
    const afterRetry = evaluateLearnerTurn(
      content,
      createInput({
        learnerInput: "SOURCE FORM",
        learnerProfile: profile,
        retryAttemptCount: 1,
      }),
    );

    expect(firstAttempt).toMatchObject({
      understood: true,
      category: "cross_dialect_transfer",
      likelySourceDialectId: "dialect-source",
      naturalAlternative: "TARGET FORM",
      learningConceptId: "concept-request",
      intervention: "guide",
      retryRecommended: true,
    });
    expect(firstAttempt.candidates).toHaveLength(1);
    expect(firstAttempt.primaryCandidate?.references.map(({ id }) => id)).toEqual([
      "variant-source",
      "variant-target",
      "transfer-source-to-target",
    ]);
    expect(afterRetry.retryRecommended).toBe(false);
  });

  it("accepts an explicitly selected known variety as relevant learner language", () => {
    const result = evaluateLearnerTurn(
      content,
      createInput({
        learnerInput: "SOURCE FORM",
        learnerProfile: createProfile({
          startingPoint: {
            kind: "dialect_learner",
            knownVarietyId: "dialect-source",
          },
        }),
      }),
    );

    expect(result.category).toBe("cross_dialect_transfer");
  });

  it("does not trust a known-variety field on an incompatible starting point", () => {
    const result = evaluateLearnerTurn(
      content,
      createInput({
        learnerInput: "SOURCE FORM",
        learnerProfile: createProfile({
          startingPoint: {
            kind: "beginner",
            knownVarietyId: "dialect-source",
          },
        }),
      }),
    );

    expect(result.category).toBe("unclear_meaning");
    expect(result.uncertaintyReason).toBe("no_relevant_learner_history");
  });

  it("does not invent or personalize transfer without relevant learner history", () => {
    const result = evaluateLearnerTurn(
      content,
      createInput({ learnerInput: "SOURCE FORM" }),
    );

    expect(result).toMatchObject({
      understood: false,
      category: "unclear_meaning",
      naturalAlternative: null,
      intervention: "clarification",
      retryRecommended: false,
      uncertaintyReason: "no_relevant_learner_history",
    });
    expect("likelySourceDialectId" in result).toBe(false);
    expect(result.explanation).toBe(
      "MANARA isn't confident enough to classify this expression.",
    );
  });

  it("recognizes a reviewed formal-register form without requiring dialect history", () => {
    const result = evaluateLearnerTurn(
      content,
      createInput({
        learnerInput: "FORMAL FORM",
        learnerProfile: createProfile({
          startingPoint: { kind: "msa_learner" },
        }),
      }),
    );

    expect(result).toMatchObject({
      understood: true,
      category: "msa_or_excessive_formality",
      likelySourceDialectId: "register-msa",
      naturalAlternative: "TARGET FORM",
      intervention: "guide",
      retryRecommended: true,
    });
  });

  it("uses uncertainty for unknown input and never emits pronunciation feedback", () => {
    const result = evaluateLearnerTurn(
      content,
      createInput({ inputMode: "audio", learnerInput: "UNKNOWN FORM" }),
    );

    expect(result.category).toBe("unclear_meaning");
    expect(result.candidates).toEqual([]);
    expect(result.likelySourceDialectId).toBeUndefined();
    expect(result.category).not.toBe("pronunciation_issue");
  });

  it("suppresses needs-review and incompletely reviewed content", () => {
    const draftTarget = createVariant({
      id: "draft-target",
      surfaceAr: "DRAFT FORM",
      validationStatus: "needs_review",
      publicationStatus: "enabled",
    });
    const incompleteTarget = createVariant({
      id: "incomplete-target",
      surfaceAr: "INCOMPLETE FORM",
      evidenceIds: [],
    });
    const draftContent = {
      variants: [draftTarget, incompleteTarget],
      transferRules: [],
    } satisfies DeterministicEvaluatorContent;

    expect(
      evaluateLearnerTurn(
        draftContent,
        createInput({ learnerInput: "DRAFT FORM" }),
      ).category,
    ).toBe("unclear_meaning");
    expect(
      evaluateLearnerTurn(
        draftContent,
        createInput({ learnerInput: "INCOMPLETE FORM" }),
      ).validationStatus,
    ).toBe("needs_review");
  });

  it("derives behavior from injected records instead of city or phrase checks", () => {
    const secondVariant = createVariant({
      id: "variant-second-concept",
      conceptId: "concept-second",
      surfaceAr: "SECOND TARGET TOKEN",
      communicativeIntent: "second_intent",
    });
    const result = evaluateLearnerTurn(
      { variants: [secondVariant], transferRules: [] },
      createInput({ learnerInput: "SECOND TARGET TOKEN" }),
    );

    expect(result).toMatchObject({
      category: "natural_target_usage",
      learningConceptId: "concept-second",
    });
  });

  it("uses uncertainty when more than one reviewed record matches", () => {
    const duplicate = createVariant({
      id: "variant-target-duplicate",
      surfaceAr: "TARGET FORM",
    });
    const result = evaluateLearnerTurn(
      { variants: [...content.variants, duplicate], transferRules: content.transferRules },
      createInput(),
    );

    expect(result).toMatchObject({
      category: "unclear_meaning",
      uncertaintyReason: "ambiguous_verified_match",
    });
  });
});
