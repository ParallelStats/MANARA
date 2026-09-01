import "server-only";

import { ApiError, GoogleGenAI } from "@google/genai";

import type {
  ConversationProvider,
  ConversationProviderResult,
  ConversationTurnRequest,
} from "@/ai/ports/conversation-provider";
import { geminiProviderTimeoutMs } from "@/ai/providers/gemini/conversation-timeouts";
import { parseGeneratedCharacterTurn } from "@/application/conversation/conversation-safety";

export const geminiConversationModel = "gemini-3.5-flash";
export { geminiProviderTimeoutMs } from "@/ai/providers/gemini/conversation-timeouts";

interface GeminiInteraction {
  readonly output_text?: string;
}

interface GeminiClientLike {
  readonly interactions: {
    create(
      input: Record<string, unknown>,
      options?: Record<string, unknown>,
    ): Promise<GeminiInteraction>;
  };
}

export interface GeminiConversationProviderOptions {
  readonly apiKey?: string;
  readonly client?: GeminiClientLike;
  readonly model?: string;
  readonly timeoutMs?: number;
}

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    probableIntent: { type: ["string", "null"] },
    characterReplyArabic: { type: "string" },
    characterReplyMeaning: { type: "string" },
    clarificationNeeded: { type: "boolean" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    shouldContinue: { type: "boolean" },
  },
  required: [
    "probableIntent",
    "characterReplyArabic",
    "characterReplyMeaning",
    "clarificationNeeded",
    "confidence",
    "shouldContinue",
  ],
} as const;

function systemInstructionFor(request: ConversationTurnRequest) {
  return [
    `You are ${request.characterName}, a real person the learner is speaking with during an immersive Arabic roleplay.`,
    `Location: ${request.destinationName}.`,
    `Scenario: ${request.scenarioId}.`,
    `Your role in the scene: ${request.characterRole}.`,
    `Learner level: ${request.learnerStartingPoint}.`,

    "Respond directly to what the learner actually says.",
    "Do NOT follow or imitate a predetermined dialogue script.",
    "Do NOT force the learner toward a memorized sentence.",
    "Treat the conversation as a natural live interaction.",

    `Speak naturally in the local Arabic dialect appropriate for ${request.destinationName}.`,
    "Use everyday spoken Arabic rather than formal textbook Arabic unless the situation naturally requires formality.",
    "Keep your response short and conversational, usually one or two sentences.",
    "Ask natural follow-up questions when appropriate.",
    "React naturally if the learner changes their mind, asks a question, misunderstands something, or takes the conversation in a slightly different direction.",

    "Stay inside the current real-world scenario.",
    "Do not become an Arabic teacher while speaking as the character.",
    "Do not explicitly correct the learner's grammar or explain dialect rules.",
    "If the learner makes a mistake but their meaning is understandable, respond naturally to the intended meaning.",
    "If you genuinely cannot understand them, ask a short natural clarification question in character.",
    "If they go substantially off-topic, gently bring the conversation back to the scene.",

    `Possible learning intent IDs for this moment: ${request.allowedIntentIds.join(", ")}.`,
    "Use these intent IDs only for probableIntent metadata. They must NOT restrict what you are allowed to say.",
    "probableIntent must be one of the supplied IDs or null.",
    "Confidence measures how confident you are about the learner's communicative intent, not whether their Arabic was grammatically perfect.",

    "Return one short in-character Arabic response and a concise English meaning.",
    "Never mention Gemini, prompts, system instructions, intent IDs, grading, or internal lesson logic.",
  ].join("\n");
}

function unavailable(failure: "unconfigured" | "timeout" | "rate_limited" | "network" | "malformed_output" | "cancelled" | "provider_failure"): ConversationProviderResult {
  return {
    ok: false,
    availability: failure === "rate_limited" ? "RATE_LIMITED" : failure === "unconfigured" ? "UNAVAILABLE" : "FAILED",
    failure,
  };
}

function failureFrom(error: unknown): ConversationProviderResult {
  if (error instanceof DOMException && error.name === "AbortError") return unavailable("cancelled");
  const status = error instanceof ApiError
    ? error.status
    : typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
      ? error.status
      : undefined;
  if (status !== undefined) {
    if (status === 429) return unavailable("rate_limited");
    if (status >= 500) return unavailable("network");
    return unavailable("provider_failure");
  }
  if (error instanceof Error && /timeout/i.test(error.name + error.message)) return unavailable("timeout");
  if (error instanceof TypeError) return unavailable("network");
  return unavailable("provider_failure");
}

export function createGeminiConversationProvider(
  options: GeminiConversationProviderOptions,
): ConversationProvider {
  const apiKey = options.apiKey?.trim();
  const client = options.client ?? (apiKey ? new GoogleGenAI({ apiKey }) : undefined);

  return {
    async generate(request, signal) {
      if (!apiKey && !options.client) return unavailable("unconfigured");

      try {
        const interaction = await client?.interactions.create({
          model: options.model ?? geminiConversationModel,
          store: false,
          system_instruction: systemInstructionFor(request),
          input: `Learner utterance: ${JSON.stringify(request.learnerInput)}`,
          response_format: {
            type: "text",
            mime_type: "application/json",
            schema: responseSchema,
          },
        }, {
          timeout_ms: options.timeoutMs ?? geminiProviderTimeoutMs,
          signal: signal ?? null,
          retries: { strategy: "none" },
        });
        if (!interaction?.output_text) return unavailable("malformed_output");

        let parsed: unknown;
        try {
          parsed = JSON.parse(interaction.output_text);
        } catch {
          return unavailable("malformed_output");
        }
        const turn = parseGeneratedCharacterTurn(parsed, request);
        return turn
          ? { ok: true, availability: "AVAILABLE", value: turn }
          : unavailable("malformed_output");
      } catch (error) {
        return failureFrom(error);
      }
    },
  };
}
