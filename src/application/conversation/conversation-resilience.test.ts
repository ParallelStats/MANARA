import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createGeminiConversationProvider } from "@/ai/providers/gemini/gemini-conversation-provider";
import type { ConversationTurnRequest } from "@/ai/ports/conversation-provider";
import { createFumbleMapModel } from "@/application/insights/create-fumble-map-model";
import { recordDurableLearningEvent } from "@/application/learning/learner-profile";
import { createScenarioSessionState } from "@/application/scenario/session-state";
import { scenarioRoute } from "@/application/travel/routes";
import { dialoguePacks } from "@/content/dialogue-packs";
import type { DialogueBeat } from "@/domain/scenario/types";
import { resolveDialogueAdvance } from "@/features/learning/lib/scenario-progression";
import { arabicMessages, englishMessages } from "@/i18n/messages";
import { createMockLearnerProfile } from "@/state/mock-learner-profile";

const request: ConversationTurnRequest = {
  operationId: "operation-fallback",
  scenarioId: "scenario-abu-dhabi-cafe",
  beatId: "adc-01-order",
  characterId: "character-abu-dhabi-cafe-mariam",
  characterName: "Mariam",
  characterRole: "café server",
  destinationName: "Abu Dhabi",
  learnerStartingPoint: "beginner",
  learnerInput: "أبغي قهوة",
  allowedIntentIds: ["concept-order-coffee"],
  deterministicNextLineArabic: null,
  deterministicNextLineMeaning: null,
};

function completeWithoutGemini(scenarioId: string) {
  const pack = dialoguePacks.find((item) => item.scenarioId === scenarioId)!;
  let beat: DialogueBeat = pack.beats.find((item) => item.id === pack.startingBeatId)!;
  for (let guard = 0; guard < 10; guard += 1) {
    const option = beat.responseOptions[0]!;
    const advance = resolveDialogueAdvance(pack, beat, option);
    if (advance.kind === "complete") return true;
    if (advance.kind !== "next_beat") return false;
    beat = advance.beat;
  }
  return false;
}

describe("Gemini-independent MANARA journey", () => {
  it.each(dialoguePacks.map(({ scenarioId }) => scenarioId))(
    "%s completes with Gemini entirely disabled",
    (scenarioId) => expect(completeWithoutGemini(scenarioId)).toBe(true),
  );

  it("preserves scenario state, learner profile, LearningEvents, and Fumble Map after provider failure", async () => {
    const state = { ...createScenarioSessionState("session", request.scenarioId, request.beatId), phase: "ready" as const };
    const profile = recordDurableLearningEvent(createMockLearnerProfile(), {
      id: "completed-before-failure",
      type: "scenario_completed",
      scenarioId: "scenario-cairo-cafe",
      occurredAt: "2026-08-29T12:00:00.000Z",
    });
    const insightsBefore = createFumbleMapModel(profile);

    await expect(createGeminiConversationProvider({}).generate(request)).resolves.toMatchObject({ ok: false });
    expect(state).toMatchObject({ phase: "ready", currentBeatId: request.beatId });
    expect(profile.learningEvents).toHaveLength(1);
    expect(createFumbleMapModel(profile)).toEqual(insightsBefore);
  });

  it("continues the same deterministic conversation after a mid-turn provider failure", async () => {
    const pack = dialoguePacks[0]!;
    const beat = pack.beats[0]!;
    const option = beat.responseOptions[0]!;
    await createGeminiConversationProvider({}).generate(request);
    expect(resolveDialogueAdvance(pack, beat, option)).toMatchObject({ kind: "next_beat" });
  });

  it("keeps direct Abu Dhabi and Cairo routes independent of learner history", () => {
    expect(scenarioRoute("abu-dhabi", "cafe")).toBe("/map/abu-dhabi/cafe");
    expect(scenarioRoute("cairo", "cafe")).toBe("/map/cairo/cafe");
  });

  it("keeps the Local Character, human Local Guide, and voice fallback as separate surfaces", () => {
    const featureRoot = join(process.cwd(), "src", "features", "learning", "components");
    const scenario = readFileSync(join(featureRoot, "immersive-scenario.tsx"), "utf8");
    const guide = readFileSync(join(featureRoot, "manara-guide.tsx"), "utf8");
    const voice = readFileSync(join(featureRoot, "voice-dock.tsx"), "utf8");
    expect(scenario).toContain("<LocalCharacter");
    expect(scenario).toContain("<ManaraGuide");
    expect(guide).toContain('t("guide.identity.localGuide"');
    expect(guide).not.toContain("@google/genai");
    expect(voice).toContain('t("voice.action.typeInstead")');
    expect(englishMessages["guide.identity.localGuide"]).toContain("Local Guide");
    expect(arabicMessages["guide.identity.localGuide"]).not.toBe(
      englishMessages["guide.identity.localGuide"],
    );
    expect(englishMessages["voice.action.typeInstead"]).toBe("Type instead");
    expect(arabicMessages["voice.action.typeInstead"]).not.toBe(
      englishMessages["voice.action.typeInstead"],
    );
  });

  it("keeps the no-key conversation path out of the optional Gemini request", () => {
    const scenario = readFileSync(join(
      process.cwd(),
      "src",
      "features",
      "learning",
      "components",
      "immersive-scenario.tsx",
    ), "utf8");
    expect(scenario).toContain(
      'inputMode !== "scripted" && conversationEnhancementAvailable',
    );
    expect(scenario).toContain("shouldShowGuideForTurn(evaluation, resolvedOption)");
  });

  it("never leaves unexpected spoken input without a Local Character reply", () => {
    const scenario = readFileSync(join(
      process.cwd(),
      "src",
      "features",
      "learning",
      "components",
      "immersive-scenario.tsx",
    ), "utf8");
    expect(scenario).toContain("shouldPresentGeneratedReply");
    expect(scenario).toContain("presentCurrentPromptAgain");
    expect(scenario).toContain('id: `repeat-${operation.id}`');
  });

  it("keeps the permanent Gemini secret out of client modules and public configuration", () => {
    const root = process.cwd();
    const clientSource = [
      "src/ai/providers/gemini/request-conversation-enhancement.ts",
      "src/features/learning/components/immersive-scenario.tsx",
      "src/features/learning/components/voice-dock.tsx",
    ].map((file) => readFileSync(join(root, file), "utf8")).join("\n");
    const envExample = readFileSync(join(root, ".env.example"), "utf8");
    expect(clientSource).not.toContain("GEMINI_API_KEY");
    expect(clientSource).not.toContain("@google/genai");
    expect(envExample).not.toContain("NEXT_PUBLIC_GEMINI");
  });
});
