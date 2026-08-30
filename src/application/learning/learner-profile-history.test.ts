import { describe, expect, it } from "vitest";

import {
  configureLearnerProfile,
  learnerProfileReducer,
  recordLearningEvent,
  recordRetryOutcome,
} from "@/application/learning/learner-profile-history";
import type { LearningEvent } from "@/domain/learning/types";
import { createMockLearnerProfile } from "@/state/mock-learner-profile";

const cairoEvaluation: LearningEvent = {
  id: "evaluation-cairo-coffee",
  type: "turn_evaluated",
  destinationId: "destination-cairo",
  scenarioId: "scenario-cairo-cafe",
  learnerStartingPoint: "beginner",
  conceptId: "concept-order-coffee",
  evaluationCategory: "natural_target_usage",
  targetDialectId: "egyptian-cairo",
  learnerInput: "عايز قهوة",
  normalizedInput: "عايز قهوه",
  matchedVariantId: "variant-egyptian-want-coffee",
  suggestedAlternativeId: "variant-emirati-want-coffee",
  understood: true,
  retryAttempted: false,
  retrySuccess: false,
  validationStatus: "verified",
  occurredAt: "2026-08-29T10:00:00.000Z",
};

describe("learner profile history", () => {
  it("configures a beginner with no prerequisite city or learning history", () => {
    const profile = configureLearnerProfile(createMockLearnerProfile(), {
      startingPoint: { kind: "beginner" },
      preferredLocale: "en",
      updatedAt: "2026-08-29T09:00:00.000Z",
    });

    expect(profile.onboardingStatus).toBe("configured");
    expect(profile.startingPoint).toEqual({ kind: "beginner" });
    expect(profile.knownConcepts).toEqual([]);
    expect(profile.learningEvents).toEqual([]);
  });

  it("stores a trimmed known variety only for dialect learners", () => {
    const dialectProfile = configureLearnerProfile(createMockLearnerProfile(), {
      startingPoint: { kind: "dialect_learner", knownVarietyId: "  egyptian-cairo  " },
      updatedAt: "2026-08-29T09:00:00.000Z",
    });
    const beginnerProfile = configureLearnerProfile(dialectProfile, {
      startingPoint: { kind: "beginner", knownVarietyId: "must-not-survive" },
      updatedAt: "2026-08-29T09:01:00.000Z",
    });

    expect(dialectProfile.startingPoint).toEqual({
      kind: "dialect_learner",
      knownVarietyId: "egyptian-cairo",
    });
    expect(beginnerProfile.startingPoint).toEqual({ kind: "beginner" });
  });

  it("redacts raw input while deriving known concepts", () => {
    const profile = recordLearningEvent(createMockLearnerProfile(), cairoEvaluation);

    expect(profile.learningEvents).toHaveLength(1);
    expect(profile.learningEvents[0]).not.toHaveProperty("learnerInput");
    expect(profile.learningEvents[0]).not.toHaveProperty("normalizedInput");
    expect(profile.knownConcepts).toEqual([
      {
        conceptId: "concept-order-coffee",
        variantIds: ["variant-egyptian-want-coffee"],
        state: "used",
        lastEventAt: "2026-08-29T10:00:00.000Z",
      },
    ]);
  });

  it("records a retry on its evaluation and merges the new variant without replacement", () => {
    const evaluated = recordLearningEvent(createMockLearnerProfile(), cairoEvaluation);
    const retried = recordRetryOutcome(evaluated, {
      evaluationEventId: cairoEvaluation.id,
      eventId: "retry-cairo-coffee",
      outcome: "successful",
      occurredAt: "2026-08-29T10:01:00.000Z",
    });

    expect(retried.learningEvents).toHaveLength(2);
    expect(retried.learningEvents[0]).toMatchObject({
      id: cairoEvaluation.id,
      retryAttempted: true,
      retrySuccess: true,
    });
    expect(retried.knownConcepts[0]?.variantIds).toEqual([
      "variant-egyptian-want-coffee",
      "variant-emirati-want-coffee",
    ]);
  });

  it("ignores duplicate events and stale retry event identifiers", () => {
    const once = recordLearningEvent(createMockLearnerProfile(), cairoEvaluation);
    expect(recordLearningEvent(once, cairoEvaluation)).toBe(once);

    const retried = recordRetryOutcome(once, {
      evaluationEventId: cairoEvaluation.id,
      eventId: "retry-one",
      outcome: "continued",
      occurredAt: "2026-08-29T10:01:00.000Z",
    });
    expect(
      recordRetryOutcome(retried, {
        evaluationEventId: cairoEvaluation.id,
        eventId: "retry-one",
        outcome: "successful",
        occurredAt: "2026-08-29T10:02:00.000Z",
      }),
    ).toBe(retried);
  });

  it("exposes the same immutable operations through a reducer", () => {
    const configured = learnerProfileReducer(createMockLearnerProfile(), {
      type: "configure",
      input: {
        startingPoint: { kind: "msa_learner" },
        updatedAt: "2026-08-29T09:00:00.000Z",
      },
    });
    const recorded = learnerProfileReducer(configured, {
      type: "record_evaluation",
      event: { ...cairoEvaluation, learnerStartingPoint: "msa_learner" },
    });

    expect(configured.support.comparisonMode).toBe("msa_to_spoken");
    expect(recorded.learningEvents).toHaveLength(1);
  });
});
