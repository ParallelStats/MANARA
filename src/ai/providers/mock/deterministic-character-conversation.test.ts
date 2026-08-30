import { describe, expect, it } from "vitest";

import { createDeterministicCharacterConversation } from "@/ai/providers/mock/deterministic-character-conversation";
import type { ReviewMetadata } from "@/domain/content/types";
import type {
  DialogueBeat,
  DialogueLine,
  DialoguePack,
  LearnerResponseOption,
} from "@/domain/scenario/types";

const review = {
  validationStatus: "verified",
  version: 1,
  evidenceIds: ["synthetic-structure-evidence"],
  reviewerIds: ["synthetic-structure-reviewer"],
  reviewedAt: "2026-08-29T00:00:00.000Z",
  reviewNotes: "Non-linguistic provider contract fixture.",
} as const satisfies ReviewMetadata;

function createLine(id: string): DialogueLine {
  return {
    ...review,
    id,
    scenarioId: "scenario-synthetic",
    characterId: "character-synthetic",
    speaker: "local_character",
    arabicText: `SYNTHETIC ${id}`,
    englishMeaning: "Synthetic provider-contract line.",
    dialectOrRegister: "none",
    communicativeIntent: "provider_contract_test",
    linguisticNotes: "Contains no Arabic teaching claim.",
    reviewerNote: "Structural fixture only.",
  };
}

function createResponse(
  id: string,
  beatId: string,
  continuation: { readonly nextBeatId: string } | { readonly completesScenario: true },
  kind: LearnerResponseOption["kind"] = "beginner_model",
): LearnerResponseOption {
  return {
    ...review,
    id,
    scenarioId: "scenario-synthetic",
    beatId,
    arabicText: `SYNTHETIC ${id}`,
    englishMeaning: "Synthetic response.",
    dialectOrRegister: "none",
    communicativeIntent: "provider_contract_test",
    kind,
    learningConceptId: "concept-synthetic",
    linguisticNotes: "Contains no Arabic teaching claim.",
    reviewerNote: "Structural fixture only.",
    ...continuation,
  };
}

function createBeat(
  id: string,
  sequence: number,
  responseOptions: readonly LearnerResponseOption[],
): DialogueBeat {
  return {
    ...review,
    id,
    scenarioId: "scenario-synthetic",
    sequence,
    characterLine: createLine(`line-${id}`),
    prompt: { ar: `SYNTHETIC PROMPT ${id}`, en: "Synthetic prompt." },
    responseOptions,
    hint: { ar: `SYNTHETIC HINT ${id}`, en: "Synthetic hint." },
    vocabulary: [],
  };
}

function createPack(overrides: Partial<DialoguePack> = {}): DialoguePack {
  const beats = [
    createBeat("beat-one", 1, [
      createResponse("response-next", "beat-one", { nextBeatId: "beat-two" }),
      createResponse(
        "response-clarify",
        "beat-one",
        { nextBeatId: "beat-two" },
        "clarification",
      ),
    ]),
    {
      ...createBeat("beat-two", 2, [
        createResponse("response-done", "beat-two", { completesScenario: true }),
      ]),
      isCompletionBeat: true,
    },
  ];

  return {
    ...review,
    id: "dialogue-synthetic",
    scenarioId: "scenario-synthetic",
    characterId: "character-synthetic",
    environmentId: "environment-synthetic",
    title: { ar: "SYNTHETIC TITLE", en: "Synthetic title" },
    startingBeatId: "beat-one",
    beats,
    publicationStatus: "enabled",
    ...overrides,
  };
}

describe("deterministic mock character conversation", () => {
  it("opens from an injected pack and advances using authored IDs only", async () => {
    const provider = createDeterministicCharacterConversation();
    const opened = await provider.open({ sessionId: "session-1", dialoguePack: createPack() });

    expect(opened).toEqual({
      ok: true,
      value: {
        sessionId: "session-1",
        scenarioId: "scenario-synthetic",
        dialoguePackId: "dialogue-synthetic",
        startingBeatId: "beat-one",
        characterLineId: "line-beat-one",
        visualState: "speaking",
        source: "mock_fixture",
      },
    });

    const continued = await provider.respond({
      sessionId: "session-1",
      turnId: "turn-1",
      beatId: "beat-one",
      responseOptionId: "response-next",
    });
    expect(continued).toEqual({
      ok: true,
      value: {
        sessionId: "session-1",
        turnId: "turn-1",
        scenarioId: "scenario-synthetic",
        beatId: "beat-one",
        responseOptionId: "response-next",
        characterLineId: "line-beat-two",
        nextBeatId: "beat-two",
        completed: false,
        visualState: "positive_reaction",
        source: "mock_fixture",
      },
    });

    const completed = await provider.respond({
      sessionId: "session-1",
      turnId: "turn-2",
      beatId: "beat-two",
      responseOptionId: "response-done",
    });
    expect(completed).toMatchObject({
      ok: true,
      value: {
        characterLineId: null,
        nextBeatId: null,
        completed: true,
        visualState: "positive_reaction",
      },
    });
  });

  it("is deterministic across independent sessions", async () => {
    const provider = createDeterministicCharacterConversation();
    const pack = createPack();

    const first = await provider.open({ sessionId: "session-a", dialoguePack: pack });
    const second = await provider.open({ sessionId: "session-b", dialoguePack: pack });

    expect(first.ok && first.value.characterLineId).toBe("line-beat-one");
    expect(second.ok && second.value.characterLineId).toBe("line-beat-one");
  });

  it("closes idempotently and distinguishes closed from unknown sessions", async () => {
    const provider = createDeterministicCharacterConversation();
    await provider.open({ sessionId: "session-close", dialoguePack: createPack() });

    await expect(provider.close("session-close")).resolves.toBeUndefined();
    await expect(provider.close("session-close")).resolves.toBeUndefined();
    await expect(provider.close("never-opened")).resolves.toBeUndefined();

    await expect(
      provider.respond({
        sessionId: "session-close",
        turnId: "turn-after-close",
        beatId: "beat-one",
        responseOptionId: "response-next",
      }),
    ).resolves.toEqual({ ok: false, errorCode: "session_closed" });
    await expect(
      provider.respond({
        sessionId: "never-opened",
        turnId: "turn-unknown",
        beatId: "beat-one",
        responseOptionId: "response-next",
      }),
    ).resolves.toEqual({ ok: false, errorCode: "unknown_session" });
  });

  it("fails closed on duplicate turns and stale beats without changing state", async () => {
    const provider = createDeterministicCharacterConversation();
    await provider.open({ sessionId: "session-stale", dialoguePack: createPack() });
    const accepted = {
      sessionId: "session-stale",
      turnId: "turn-1",
      beatId: "beat-one",
      responseOptionId: "response-next",
    } as const;

    expect((await provider.respond(accepted)).ok).toBe(true);
    await expect(provider.respond(accepted)).resolves.toEqual({
      ok: false,
      errorCode: "duplicate_turn",
    });
    await expect(
      provider.respond({ ...accepted, turnId: "turn-stale" }),
    ).resolves.toEqual({ ok: false, errorCode: "stale_beat" });

    expect(
      (
        await provider.respond({
          sessionId: "session-stale",
          turnId: "turn-2",
          beatId: "beat-two",
          responseOptionId: "response-done",
        })
      ).ok,
    ).toBe(true);
  });

  it("rejects unknown responses without consuming the turn or advancing", async () => {
    const provider = createDeterministicCharacterConversation();
    await provider.open({ sessionId: "session-response", dialoguePack: createPack() });

    await expect(
      provider.respond({
        sessionId: "session-response",
        turnId: "turn-1",
        beatId: "beat-one",
        responseOptionId: "not-authored",
      }),
    ).resolves.toEqual({ ok: false, errorCode: "unknown_response_option" });

    const recovered = await provider.respond({
      sessionId: "session-response",
      turnId: "turn-1",
      beatId: "beat-one",
      responseOptionId: "response-clarify",
    });
    expect(recovered).toMatchObject({
      ok: true,
      value: {
        nextBeatId: "beat-two",
        visualState: "clarification_reaction",
      },
    });
  });

  it("contains a deterministic recoverable failure without mutating the session", async () => {
    const provider = createDeterministicCharacterConversation({
      failOnTurnIds: ["turn-fails"],
    });
    await provider.open({ sessionId: "session-failure", dialoguePack: createPack() });

    await expect(
      provider.respond({
        sessionId: "session-failure",
        turnId: "turn-fails",
        beatId: "beat-one",
        responseOptionId: "response-next",
      }),
    ).resolves.toEqual({ ok: false, errorCode: "mock_failure" });

    const recovered = await provider.respond({
      sessionId: "session-failure",
      turnId: "turn-recovers",
      beatId: "beat-one",
      responseOptionId: "response-next",
    });
    expect(recovered.ok).toBe(true);
  });

  it("rejects malformed packs and duplicate or completed session operations", async () => {
    const provider = createDeterministicCharacterConversation();
    const malformed = createPack({ startingBeatId: "missing-beat" });

    await expect(
      provider.open({ sessionId: "session-invalid", dialoguePack: malformed }),
    ).resolves.toEqual({ ok: false, errorCode: "invalid_dialogue_pack" });

    const pack = createPack();
    expect((await provider.open({ sessionId: "session-live", dialoguePack: pack })).ok).toBe(
      true,
    );
    await expect(
      provider.open({ sessionId: "session-live", dialoguePack: pack }),
    ).resolves.toEqual({ ok: false, errorCode: "duplicate_session" });

    await provider.respond({
      sessionId: "session-live",
      turnId: "turn-next",
      beatId: "beat-one",
      responseOptionId: "response-next",
    });
    await provider.respond({
      sessionId: "session-live",
      turnId: "turn-done",
      beatId: "beat-two",
      responseOptionId: "response-done",
    });
    await expect(
      provider.respond({
        sessionId: "session-live",
        turnId: "turn-too-late",
        beatId: "beat-two",
        responseOptionId: "response-done",
      }),
    ).resolves.toEqual({ ok: false, errorCode: "session_completed" });
  });
});
