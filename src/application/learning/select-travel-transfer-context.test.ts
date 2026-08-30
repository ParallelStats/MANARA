import { describe, expect, it } from "vitest";

import {
  configureLearnerProfile,
  recordLearningEvent,
} from "@/application/learning/learner-profile-history";
import { selectTravelTransferContext } from "@/application/learning/select-travel-transfer-context";
import type { LearningEvent } from "@/domain/learning/types";
import { createMockLearnerProfile } from "@/state/mock-learner-profile";

function cairoEvent(validationStatus: "needs_review" | "verified"): LearningEvent {
  return {
    id: `cairo-${validationStatus}`,
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
    understood: true,
    retryAttempted: false,
    retrySuccess: false,
    validationStatus,
    occurredAt: "2026-08-29T10:00:00.000Z",
  };
}

describe("selectTravelTransferContext", () => {
  it("keeps direct city entry valid with an empty learner history", () => {
    expect(
      selectTravelTransferContext(createMockLearnerProfile(), "emirati-abu-dhabi"),
    ).toEqual({ targetDialectId: "emirati-abu-dhabi", conceptIds: [] });
  });

  it("uses a self-declared known variety without requiring a previous city", () => {
    const profile = configureLearnerProfile(createMockLearnerProfile(), {
      startingPoint: { kind: "dialect_learner", knownVarietyId: "egyptian-cairo" },
      updatedAt: "2026-08-29T09:00:00.000Z",
    });

    expect(selectTravelTransferContext(profile, "emirati-abu-dhabi")).toEqual({
      sourceDialectId: "egyptian-cairo",
      targetDialectId: "emirati-abu-dhabi",
      conceptIds: [],
    });
  });

  it("lets verified Cairo learning history inform later Abu Dhabi travel", () => {
    const profile = recordLearningEvent(createMockLearnerProfile(), cairoEvent("verified"));

    expect(selectTravelTransferContext(profile, "emirati-abu-dhabi")).toEqual({
      sourceDialectId: "egyptian-cairo",
      targetDialectId: "emirati-abu-dhabi",
      conceptIds: ["concept-order-coffee"],
    });
  });

  it("does not turn review-pending history into a source-dialect claim", () => {
    const profile = recordLearningEvent(
      createMockLearnerProfile(),
      cairoEvent("needs_review"),
    );

    expect(selectTravelTransferContext(profile, "emirati-abu-dhabi")).toEqual({
      targetDialectId: "emirati-abu-dhabi",
      conceptIds: ["concept-order-coffee"],
    });
  });
});
