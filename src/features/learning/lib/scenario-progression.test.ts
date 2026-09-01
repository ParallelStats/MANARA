import { describe, expect, it } from "vitest";

import { getDialoguePackByScenarioId } from "@/content/dialogue-packs";
import {
  getDialogueBeat,
  resolveDeterministicResponseOption,
  resolveDialogueAdvance,
  shouldShowGuideForTurn,
} from "@/features/learning/lib/scenario-progression";
import type { EvaluationResult } from "@/domain/learning/types";

function unclassifiedEvaluation(): EvaluationResult {
  return {
    id: "evaluation-off-topic",
    turnId: "adc-01-order",
    scenarioId: "scenario-abu-dhabi-cafe",
    targetDialectId: "dialect-emirati-abu-dhabi",
    understood: false,
    category: "unclear_meaning",
    learnerInput: "كيف حالك؟",
    normalizedInput: "كيف حالك؟",
    naturalAlternative: null,
    explanation: "MANARA isn't confident enough to classify this expression.",
    comparison: null,
    confidence: 0,
    validationStatus: "needs_review",
    inputMode: "text",
    candidates: [],
    primaryCandidate: null,
    priority: "p0",
    intervention: "clarification",
    retryRecommended: false,
    uncertaintyReason: "no_verified_match",
  };
}

describe("scenario progression", () => {
  it("follows the authored next-beat path and reaches completion", () => {
    const pack = getDialoguePackByScenarioId("scenario-cairo-cafe");
    expect(pack).toBeDefined();
    if (!pack) return;

    let beat = getDialogueBeat(pack, pack.startingBeatId);
    expect(beat).toBeDefined();
    if (!beat) return;

    for (let turn = 0; turn < pack.beats.length; turn += 1) {
      const option = beat.responseOptions[0];
      expect(option).toBeDefined();
      if (!option) return;

      const advance = resolveDialogueAdvance(pack, beat, option);
      if (advance.kind === "complete") {
        expect(beat.isCompletionBeat).toBe(true);
        return;
      }

      expect(advance.kind).toBe("next_beat");
      if (advance.kind !== "next_beat") return;
      expect(advance.beat.sequence).toBeGreaterThan(beat.sequence);
      beat = advance.beat;
    }

    throw new Error("The authored scenario path did not reach completion.");
  });

  it("redirects an unmatched or off-topic response instead of silently advancing", () => {
    expect(shouldShowGuideForTurn(unclassifiedEvaluation(), null)).toBe(true);
  });

  it("matches a unique on-topic shortened response without requiring Gemini", () => {
    const pack = getDialoguePackByScenarioId("scenario-abu-dhabi-cafe")!;
    const beat = getDialogueBeat(pack, pack.startingBeatId)!;

    expect(resolveDeterministicResponseOption("أبغي قهوة", beat.responseOptions)?.id)
      .toBe("response-adc-01-target");
  });

  it("does not guess when a response is unrelated or matches several options", () => {
    const pack = getDialoguePackByScenarioId("scenario-abu-dhabi-cafe")!;
    const beat = getDialogueBeat(pack, pack.startingBeatId)!;

    expect(resolveDeterministicResponseOption("كيف حالك؟", beat.responseOptions)).toBeNull();
    expect(resolveDeterministicResponseOption("قهوة", beat.responseOptions)).toBeNull();
  });

  it("does not interrupt an authored on-topic target response in review mode", () => {
    const pack = getDialoguePackByScenarioId("scenario-abu-dhabi-cafe")!;
    const beat = getDialogueBeat(pack, pack.startingBeatId)!;
    const targetOption = beat.responseOptions.find(({ kind }) => kind === "target_dialect")!;
    expect(shouldShowGuideForTurn(unclassifiedEvaluation(), targetOption)).toBe(false);
  });
});
