import { describe, expect, it, vi } from "vitest";

import type { ConversationTurnRequest } from "@/ai/ports/conversation-provider";
import {
  conversationEnhancementTimeoutMs,
  geminiProviderTimeoutMs,
} from "@/ai/providers/gemini/conversation-timeouts";
import { requestConversationEnhancement } from "@/ai/providers/gemini/request-conversation-enhancement";

const request: ConversationTurnRequest = {
  operationId: "operation-1",
  scenarioId: "scenario-abu-dhabi-cafe",
  beatId: "adc-01-order",
  characterId: "character-abu-dhabi-cafe-mariam",
  characterName: "Mariam",
  characterRole: "café server",
  destinationName: "Abu Dhabi",
  learnerStartingPoint: "beginner",
  learnerInput: "أبغي قهوة لو سمحت",
  allowedIntentIds: ["concept-order-coffee"],
  deterministicNextLineArabic: "أكيد. حارّة ولا باردة؟",
  deterministicNextLineMeaning: "Of course. Hot or cold?",
};

function hangingFetch(): typeof fetch {
  return vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new Error("aborted")), {
        once: true,
      });
    })) as typeof fetch;
}

describe("optional conversation enhancement request", () => {
  it("leaves enough client time for the bounded server request to finish", () => {
    expect(conversationEnhancementTimeoutMs).toBeGreaterThan(geminiProviderTimeoutMs);
  });

  it("times out instead of blocking deterministic progression", async () => {
    const result = await requestConversationEnhancement(
      request,
      new AbortController().signal,
      hangingFetch(),
      5,
    );
    expect(result).toEqual({ ok: false, availability: "FAILED", failure: "timeout" });
  });

  it("cancels stale provider work without turning it into a network failure", async () => {
    const controller = new AbortController();
    const pending = requestConversationEnhancement(request, controller.signal, hangingFetch(), 1_000);
    controller.abort();
    await expect(pending).resolves.toEqual({
      ok: false,
      availability: "FAILED",
      failure: "cancelled",
    });
  });
});
