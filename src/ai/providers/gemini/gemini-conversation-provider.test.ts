import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createGeminiConversationProvider,
  geminiConversationModel,
  geminiProviderTimeoutMs,
} from "@/ai/providers/gemini/gemini-conversation-provider";
import type { ConversationTurnRequest } from "@/ai/ports/conversation-provider";

const request: ConversationTurnRequest = {
  operationId: "operation-1",
  scenarioId: "scenario-abu-dhabi-cafe",
  beatId: "beat-1",
  characterId: "mariam",
  characterName: "Mariam",
  characterRole: "café server",
  destinationName: "Abu Dhabi",
  learnerStartingPoint: "beginner",
  learnerInput: "أبغي قهوة",
  allowedIntentIds: ["concept-order-coffee"],
  deterministicNextLineArabic: "حارة ولا باردة؟",
  deterministicNextLineMeaning: "Hot or cold?",
};

const validOutput = JSON.stringify({
  probableIntent: "concept-order-coffee",
  characterReplyArabic: "تمام، حارة ولا باردة؟",
  characterReplyMeaning: "Great, hot or cold?",
  clarificationNeeded: false,
  confidence: 0.92,
  shouldContinue: true,
  validationStatus: "verified",
});

function clientThat(create: () => Promise<{ output_text?: string }>) {
  return { interactions: { create: vi.fn(create) } };
}

describe("Gemini conversation provider", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("treats an absent API key as a normal unavailable configuration", async () => {
    await expect(createGeminiConversationProvider({}).generate(request)).resolves.toEqual({
      ok: false,
      availability: "UNAVAILABLE",
      failure: "unconfigured",
    });
  });

  it("uses the stable selected model, structured response format, and no provider storage", async () => {
    const client = clientThat(async () => ({ output_text: validOutput }));
    const result = await createGeminiConversationProvider({ client }).generate(request);

    expect(result).toMatchObject({ ok: true, availability: "AVAILABLE" });
    expect(client.interactions.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: geminiConversationModel, store: false }),
      expect.objectContaining({
        retries: { strategy: "none" },
        timeout_ms: geminiProviderTimeoutMs,
      }),
    );
  });

  it("maps timeouts to a quiet deterministic-fallback result", async () => {
    const timeout = Object.assign(new Error("request timeout"), { name: "TimeoutError" });
    const result = await createGeminiConversationProvider({
      client: clientThat(async () => { throw timeout; }),
    }).generate(request);
    expect(result).toEqual({ ok: false, availability: "FAILED", failure: "timeout" });
  });

  it("maps quota and HTTP 429 responses to RATE_LIMITED", async () => {
    const result = await createGeminiConversationProvider({
      client: clientThat(async () => { throw Object.assign(new Error("quota"), { status: 429 }); }),
    }).generate(request);
    expect(result).toEqual({ ok: false, availability: "RATE_LIMITED", failure: "rate_limited" });
  });

  it("discards malformed or schema-invalid model output", async () => {
    const malformed = createGeminiConversationProvider({
      client: clientThat(async () => ({ output_text: "not-json" })),
    });
    const invalid = createGeminiConversationProvider({
      client: clientThat(async () => ({ output_text: JSON.stringify({ probableIntent: "invented" }) })),
    });
    await expect(malformed.generate(request)).resolves.toMatchObject({ failure: "malformed_output" });
    await expect(invalid.generate(request)).resolves.toMatchObject({ failure: "malformed_output" });
  });

  it("maps network and service failures without throwing into the scenario", async () => {
    const network = createGeminiConversationProvider({
      client: clientThat(async () => { throw new TypeError("offline"); }),
    });
    const service = createGeminiConversationProvider({
      client: clientThat(async () => { throw Object.assign(new Error("busy"), { status: 503 }); }),
    });
    await expect(network.generate(request)).resolves.toMatchObject({ failure: "network" });
    await expect(service.generate(request)).resolves.toMatchObject({ failure: "network" });
  });

  it("honors cancellation and returns no generated turn", async () => {
    const controller = new AbortController();
    controller.abort();
    const provider = createGeminiConversationProvider({
      client: clientThat(async () => { throw new DOMException("aborted", "AbortError"); }),
    });
    await expect(provider.generate(request, controller.signal)).resolves.toMatchObject({ failure: "cancelled" });
  });
});
