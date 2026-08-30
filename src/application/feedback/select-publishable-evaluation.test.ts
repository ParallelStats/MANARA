import { describe, expect, it } from "vitest";

import { selectPublishableEvaluation } from "@/application/feedback/select-publishable-evaluation";
import type { EvaluationResult } from "@/domain/learning/types";

function createResult(
  validationStatus: "needs_review" | "verified",
  category: EvaluationResult["candidates"][number]["category"] = "cross_dialect_transfer",
): EvaluationResult {
  const candidate = {
    category,
    runtimeConfidence: 0.99,
    references: [{ id: "variant-1", version: 1, validationStatus }],
  } as const;

  return {
    id: "evaluation-1",
    turnId: "turn-1",
    scenarioId: "scenario-1",
    targetDialectId: "target-1",
    understood: true,
    category,
    learnerInput: "fixture-input",
    normalizedInput: "fixture-input",
    naturalAlternative: "fixture-alternative",
    explanation: "Fixture explanation.",
    comparison: null,
    learningConceptId: "concept-1",
    confidence: 0.99,
    validationStatus,
    inputMode: "scripted",
    candidates: [candidate],
    primaryCandidate: candidate,
    priority: "p2",
    intervention: "guide",
    retryRecommended: true,
  };
}

describe("selectPublishableEvaluation", () => {
  it("suppresses unverified teaching claims even at high runtime confidence", () => {
    expect(selectPublishableEvaluation(createResult("needs_review"))).toBeUndefined();
  });

  it("allows a fully verified text classification", () => {
    expect(selectPublishableEvaluation(createResult("verified"), [
      { id: "variant-1", version: 1, validationStatus: "verified" },
    ])?.category).toBe(
      "cross_dialect_transfer",
    );
  });

  it("does not trust verification metadata supplied only by an evaluator", () => {
    expect(selectPublishableEvaluation(createResult("verified"))).toBeUndefined();
    expect(selectPublishableEvaluation(createResult("verified"), [
      { id: "variant-1", version: 2, validationStatus: "verified" },
    ])).toBeUndefined();
  });

  it("keeps pronunciation feedback disabled", () => {
    expect(
      selectPublishableEvaluation(createResult("verified", "pronunciation_issue"), [
        { id: "variant-1", version: 1, validationStatus: "verified" },
      ]),
    ).toBeUndefined();
  });
});
