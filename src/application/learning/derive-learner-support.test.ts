import { describe, expect, it } from "vitest";

import { deriveLearnerSupport } from "@/application/learning/derive-learner-support";

describe("deriveLearnerSupport", () => {
  it("gives beginners proactive, modeled support", () => {
    expect(deriveLearnerSupport({ kind: "beginner" })).toEqual({
      translation: "always",
      transliteration: "available",
      phraseHints: "proactive",
      vocabularyPreview: true,
      expectedResponseComplexity: "modeled_phrase",
      correctionDepth: "minimal",
      comparisonMode: "none",
    });
  });

  it("bridges MSA without treating it as an error", () => {
    expect(deriveLearnerSupport({ kind: "msa_learner" }).comparisonMode).toBe(
      "msa_to_spoken",
    );
  });

  it("prepares dialect learners for cross-dialect comparison", () => {
    const support = deriveLearnerSupport({
      kind: "dialect_learner",
      knownVarietyId: "egyptian-cairo",
    });

    expect(support.comparisonMode).toBe("cross_dialect");
    expect(support.expectedResponseComplexity).toBe("open_short_response");
  });

  it("gives heritage or partial learners contextual naturalness support", () => {
    const support = deriveLearnerSupport({ kind: "heritage_or_partial" });

    expect(support.comparisonMode).toBe("naturalness");
    expect(support.vocabularyPreview).toBe(true);
  });
});
