"use client";

import type {
  ConversationProviderResult,
  ConversationTurnRequest,
} from "@/ai/ports/conversation-provider";
import { conversationEnhancementTimeoutMs } from "@/ai/providers/gemini/conversation-timeouts";
import { parseGeneratedCharacterTurn } from "@/application/conversation/conversation-safety";

type FetchLike = typeof fetch;

export { conversationEnhancementTimeoutMs } from "@/ai/providers/gemini/conversation-timeouts";

export async function requestConversationEnhancement(
  request: ConversationTurnRequest,
  signal: AbortSignal,
  fetcher: FetchLike = fetch,
  timeoutMs = conversationEnhancementTimeoutMs,
): Promise<ConversationProviderResult> {
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort();
  if (signal.aborted) controller.abort();
  else signal.addEventListener("abort", cancel, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetcher("/api/conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false, availability: "FAILED", failure: "provider_failure" };

    const body = await response.json() as unknown;
    if (
      typeof body === "object" && body !== null &&
      "ok" in body && body.ok === false &&
      "availability" in body &&
      ["UNAVAILABLE", "RATE_LIMITED", "FAILED"].includes(String(body.availability))
    ) {
      return body as ConversationProviderResult;
    }
    if (
      typeof body === "object" && body !== null && "ok" in body && body.ok === true &&
      "value" in body
    ) {
      const turn = parseGeneratedCharacterTurn(body.value, request);
      if (turn) return { ok: true, availability: "AVAILABLE", value: turn };
    }
    return { ok: false, availability: "FAILED", failure: "malformed_output" };
  } catch {
    if (timedOut) return { ok: false, availability: "FAILED", failure: "timeout" };
    if (signal.aborted) return { ok: false, availability: "FAILED", failure: "cancelled" };
    return { ok: false, availability: "FAILED", failure: "network" };
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", cancel);
  }
}
