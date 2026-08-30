import { describe, expect, it } from "vitest";

import { createFumbleMapModel } from "@/application/insights/create-fumble-map-model";
import { configureLearnerProfile } from "@/application/learning/learner-profile-history";
import type {
  DurableLearningEvent,
  LearnerProfile,
  LearnerStartingPointKind,
  SourceDialectConfidence,
} from "@/domain/learning/types";
import { createLearnerProfileRepository, type StorageLike } from "@/state/learner-profile-repository";
import { createMockLearnerProfile } from "@/state/mock-learner-profile";

type Turn = Extract<DurableLearningEvent, { type: "turn_evaluated" }>;

function profile(kind: LearnerStartingPointKind = "dialect_learner"): LearnerProfile {
  return configureLearnerProfile(createMockLearnerProfile(), {
    startingPoint: kind === "dialect_learner"
      ? { kind, knownVarietyId: "egyptian-cairo" }
      : { kind },
    updatedAt: "2026-01-01T00:00:00.000Z",
  });
}

function turn(id: string, overrides: Partial<Turn> = {}): Turn {
  return {
    id,
    type: "turn_evaluated",
    destinationId: "destination-abu-dhabi",
    scenarioId: "scenario-abu-dhabi-cafe",
    learnerStartingPoint: "dialect_learner",
    conceptId: "concept-order-coffee",
    evaluationCategory: "cross_dialect_transfer",
    targetDialectId: "emirati-abu-dhabi",
    understood: true,
    retryAttempted: false,
    retrySuccess: false,
    validationStatus: "verified",
    occurredAt: `2026-01-${id.padStart(2, "0")}T10:00:00.000Z`,
    ...overrides,
  };
}

function withEvents(base: LearnerProfile, events: readonly DurableLearningEvent[]): LearnerProfile {
  return { ...base, learningEvents: events };
}

function findType(model: ReturnType<typeof createFumbleMapModel>, type: string) {
  return model.insights.find((insight) => insight.type === type);
}

function sourceEvent(
  id: string,
  confidence: SourceDialectConfidence,
  source: string | undefined = "egyptian-cairo",
) {
  return turn(id, {
    ...(source ? { likelySourceDialectId: source } : {}),
    sourceDialectConfidence: confidence,
  });
}

describe("Fumble Map deterministic learning history", () => {
  it("turns one local-adaptation event into only an observation", () => {
    const model = createFumbleMapModel(withEvents(profile(), [turn("1")]));
    expect(findType(model, "LOCAL_ADAPTATION")?.evidenceLevel).toBe("OBSERVATION");
    expect(findType(model, "CROSS_DIALECT_PATTERN")).toBeUndefined();
  });

  it("promotes repeated local adaptation to a persistent pattern", () => {
    const model = createFumbleMapModel(withEvents(profile(), [turn("1"), turn("2")]));
    expect(findType(model, "LOCAL_ADAPTATION")?.evidenceLevel).toBe("PERSISTENT_PATTERN");
  });

  it("recognizes repeated successful retries as adaptation strength", () => {
    const model = createFumbleMapModel(withEvents(profile(), [
      turn("1", { retryAttempted: true, retrySuccess: true }),
      turn("2", { retryAttempted: true, retrySuccess: true }),
    ]));
    expect(findType(model, "ADAPTATION_STRENGTH")?.evidenceLevel).toBe("STRENGTH");
  });

  it("recognizes repeated natural communication as communication strength", () => {
    const natural = { evaluationCategory: "natural_target_usage" as const };
    const model = createFumbleMapModel(withEvents(profile(), [turn("1", natural), turn("2", natural)]));
    expect(findType(model, "COMMUNICATION_STRENGTH")?.evidenceLevel).toBe("STRENGTH");
  });

  it("creates beginner progress without dialect history", () => {
    const completion: DurableLearningEvent = {
      id: "complete-1", type: "scenario_completed", scenarioId: "scenario-cairo-cafe", occurredAt: "2026-01-01T11:00:00.000Z",
    };
    const model = createFumbleMapModel(withEvents(profile("beginner"), [completion]));
    expect(findType(model, "BEGINNER_PROGRESS")).toMatchObject({
      evidenceLevel: "OBSERVATION", likelySourceDialectId: null,
    });
  });

  it("creates MSA register adaptation without classifying a source dialect", () => {
    const event = turn("1", { learnerStartingPoint: "msa_learner", evaluationCategory: "msa_or_excessive_formality" });
    const insight = findType(createFumbleMapModel(withEvents(profile("msa_learner"), [event])), "REGISTER_ADAPTATION");
    expect(insight).toMatchObject({ likelySourceDialectId: null, sourceDialectConfidence: "UNKNOWN" });
    expect(insight?.summary).toContain("formal Arabic was understood");
  });

  it("returns a useful, genuinely empty model for no history", () => {
    const model = createFumbleMapModel(profile("beginner"));
    expect(model).toMatchObject({ isEmpty: true, insights: [], recommendations: [], journey: [] });
  });

  it("traces every recommendation to its insight and actual events", () => {
    const model = createFumbleMapModel(withEvents(profile(), [turn("1"), turn("2")]));
    for (const recommendation of model.recommendations) {
      const insight = model.insights.find(({ id }) => id === recommendation.insightId);
      expect(insight).toBeDefined();
      expect(recommendation.supportingEventIds).toEqual(insight?.supportingEventIds);
      expect(recommendation.supportingEventIds.every((id) => ["1", "2"].includes(id))).toBe(true);
    }
  });

  it("keeps insight generation working when source dialect is unknown", () => {
    const model = createFumbleMapModel(withEvents(profile(), [sourceEvent("1", "UNKNOWN", undefined)]));
    expect(findType(model, "LOCAL_ADAPTATION")).toBeDefined();
    expect(findType(model, "CROSS_DIALECT_PATTERN")).toBeUndefined();
  });

  it("allows likely source dialect to remain null indefinitely", () => {
    const events = [sourceEvent("1", "UNKNOWN", undefined), sourceEvent("2", "UNKNOWN", undefined), sourceEvent("3", "UNKNOWN", undefined)];
    expect(createFumbleMapModel(withEvents(profile(), events)).insights.every(({ likelySourceDialectId }) => likelySourceDialectId === null)).toBe(true);
  });

  it("creates a cross-dialect pattern only from repeated high-confidence verified evidence", () => {
    const insight = findType(
      createFumbleMapModel(withEvents(profile(), [sourceEvent("1", "HIGH"), sourceEvent("2", "HIGH")])),
      "CROSS_DIALECT_PATTERN",
    );
    expect(insight).toMatchObject({ likelySourceDialectId: "egyptian-cairo", sourceDialectConfidence: "HIGH" });
  });

  it("does not turn low-confidence origin into a learner-facing source claim", () => {
    const model = createFumbleMapModel(withEvents(profile(), [sourceEvent("1", "LOW"), sourceEvent("2", "LOW")]));
    expect(findType(model, "CROSS_DIALECT_PATTERN")).toBeUndefined();
    expect(model.insights.every(({ likelySourceDialectId }) => likelySourceDialectId === null)).toBe(true);
  });

  it("does not infer a dialect habit from one phrase", () => {
    expect(findType(createFumbleMapModel(withEvents(profile(), [sourceEvent("1", "HIGH")])), "CROSS_DIALECT_PATTERN")).toBeUndefined();
  });

  it("counts a successful retry positively", () => {
    const model = createFumbleMapModel(withEvents(profile(), [turn("1", { retryAttempted: true, retrySuccess: true })]));
    expect(findType(model, "LOCAL_ADAPTATION")?.successfulRetryCount).toBe(1);
    expect(model.insights.some(({ summary }) => summary.toLowerCase().includes("failed"))).toBe(false);
  });

  it("requires repeated difficulty before a persistent difficulty insight", () => {
    const miss = { evaluationCategory: "vocabulary_error" as const, understood: false };
    const one = createFumbleMapModel(withEvents(profile(), [turn("1", miss)]));
    const two = createFumbleMapModel(withEvents(profile(), [turn("1", miss), turn("2", miss)]));
    expect(findType(one, "VOCABULARY_GAP")).toBeUndefined();
    expect(findType(two, "VOCABULARY_GAP")?.evidenceLevel).toBe("PERSISTENT_PATTERN");
  });

  it("prioritizes recommendations for the learner's starting point", () => {
    const msaEvents = [
      turn("1", { learnerStartingPoint: "msa_learner", evaluationCategory: "msa_or_excessive_formality" }),
      turn("2", { learnerStartingPoint: "msa_learner", evaluationCategory: "natural_target_usage" }),
      turn("3", { learnerStartingPoint: "msa_learner", evaluationCategory: "natural_target_usage" }),
    ];
    const beginnerCompletion: DurableLearningEvent = {
      id: "complete", type: "scenario_completed", scenarioId: "scenario-cairo-cafe", occurredAt: "2026-02-01T00:00:00.000Z",
    };
    expect(createFumbleMapModel(withEvents(profile("msa_learner"), msaEvents)).recommendations[0]?.insightId).toContain("register_adaptation");
    expect(createFumbleMapModel(withEvents(profile("beginner"), [beginnerCompletion])).recommendations[0]?.insightId).toBe("beginner-progress");
  });

  it("reloads the same learner history after route-like repository reconstruction", async () => {
    const values = new Map<string, string>();
    const storage: StorageLike = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value); },
      removeItem: (key) => { values.delete(key); },
    };
    const before = withEvents(profile(), [turn("1"), turn("2")]);
    await createLearnerProfileRepository(storage).save(before);
    const after = await createLearnerProfileRepository(storage).load();
    expect(createFumbleMapModel(after)).toEqual(createFumbleMapModel(before));
  });

  it("derives the same model deterministically", () => {
    const input = withEvents(profile(), [turn("2"), turn("1")]);
    expect(createFumbleMapModel(input)).toEqual(createFumbleMapModel(input));
  });

  it("requires no AI provider or external service", () => {
    const model = createFumbleMapModel(withEvents(profile(), [turn("1")]));
    expect(model.insights).toHaveLength(1);
    expect(model.recommendations[0]?.practiceHref).toBe("/map/abu-dhabi/cafe");
  });

  it("does not emit fake statistics for empty history", () => {
    const serialized = JSON.stringify(createFumbleMapModel(profile("beginner")));
    expect(serialized).not.toMatch(/percent|percentage|score|accuracy|%/i);
  });
});
