import type { ValidationStatus } from "@/domain/content/types";

export type ProviderAvailability = "AVAILABLE" | "UNAVAILABLE" | "RATE_LIMITED" | "FAILED";

export type ProviderFailure =
  | "unconfigured"
  | "timeout"
  | "rate_limited"
  | "network"
  | "malformed_output"
  | "cancelled"
  | "provider_failure";

export interface ConversationTurnRequest {
  readonly operationId: string;
  readonly scenarioId: string;
  readonly beatId: string;
  readonly characterId: string;
  readonly characterName: string;
  readonly characterRole: string;
  readonly destinationName: string;
  readonly learnerStartingPoint: string;
  readonly learnerInput: string;
  readonly allowedIntentIds: readonly string[];
  readonly deterministicNextLineArabic: string | null;
  readonly deterministicNextLineMeaning: string | null;
}

export interface GeneratedCharacterTurn {
  readonly operationId: string;
  readonly probableIntent: string | null;
  readonly characterReplyArabic: string;
  readonly characterReplyMeaning: string;
  readonly clarificationNeeded: boolean;
  readonly confidence: number;
  readonly shouldContinue: boolean;
  readonly validationStatus: ValidationStatus;
  readonly source: "gemini";
}

export type ConversationProviderResult =
  | Readonly<{
      ok: true;
      availability: "AVAILABLE";
      value: GeneratedCharacterTurn;
    }>
  | Readonly<{
      ok: false;
      availability: Exclude<ProviderAvailability, "AVAILABLE">;
      failure: ProviderFailure;
    }>;

export interface ConversationProvider {
  generate(
    request: ConversationTurnRequest,
    signal?: AbortSignal,
  ): Promise<ConversationProviderResult>;
}
