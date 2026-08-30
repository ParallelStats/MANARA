import { describe, expect, it } from "vitest";

import { parseGeneratedCharacterTurn, selectSafeGeneratedAdvance } from "@/application/conversation/conversation-safety";
import { getDialoguePackByScenarioId } from "@/content/dialogue-packs";
import type { ConversationTurnRequest } from "@/ai/ports/conversation-provider";

const request: ConversationTurnRequest = {
  operationId: "operation-1",
  scenarioId: "scenario-abu-dhabi-cafe",
  beatId: "adc-01-order",
  characterId: "character-abu-dhabi-cafe-mariam",
  characterName: "Mariam",
  characterRole: "café server",
  destinationName: "Abu Dhabi",
  learnerStartingPoint: "beginner",
  learnerInput: "قهوة لو سمحتي",
  allowedIntentIds: ["concept-order-coffee"],
  deterministicNextLineArabic: null,
  deterministicNextLineMeaning: null,
};

function generated(overrides: Record<string, unknown> = {}) {
  return parseGeneratedCharacterTurn({
    probableIntent: "concept-order-coffee",
    characterReplyArabic: "تمام، أي قهوة؟",
    characterReplyMeaning: "Okay, which coffee?",
    clarificationNeeded: false,
    confidence: 0.95,
    shouldContinue: true,
    validationStatus: "verified",
    likelySourceDialect: "invented-by-model",
    ...overrides,
  }, request);
}

describe("conversation safety boundary", () => {
  it("forces every generated turn to needs_review even when Gemini claims verification", () => {
    expect(generated()).toMatchObject({ validationStatus: "needs_review", source: "gemini" });
  });

  it("drops unsupported dialect-origin fields and leaves origin unknown", () => {
    expect(generated()).not.toHaveProperty("likelySourceDialect");
  });

  it("rejects intents outside the current deterministic allow-list", () => {
    expect(generated({ probableIntent: "leave-the-scenario" })).toBeUndefined();
  });

  it("does not let generated intent advance through needs_review content", () => {
    const opening = getDialoguePackByScenarioId(request.scenarioId)?.beats[0];
    expect(selectSafeGeneratedAdvance(generated()!, opening?.responseOptions ?? [])).toBeNull();
  });

  it("allows only one high-confidence, human-verified deterministic mapping", () => {
    const opening = getDialoguePackByScenarioId(request.scenarioId)?.beats[0];
    const verified = (opening?.responseOptions ?? []).map((option, index) => ({
      ...option,
      validationStatus: index === 0 ? "verified" as const : option.validationStatus,
    }));
    expect(selectSafeGeneratedAdvance(generated()!, verified)?.id).toBe(verified[0]?.id);
    expect(selectSafeGeneratedAdvance(generated({ confidence: 0.4 })!, verified)).toBeNull();
    expect(selectSafeGeneratedAdvance(generated({ clarificationNeeded: true })!, verified)).toBeNull();
  });
});
