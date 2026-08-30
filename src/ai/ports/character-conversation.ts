import type { DialoguePack, CharacterVisualState } from "@/domain/scenario/types";

export type CharacterConversationFailureCode =
  | "duplicate_session"
  | "duplicate_turn"
  | "invalid_dialogue_pack"
  | "mock_failure"
  | "session_closed"
  | "session_completed"
  | "stale_beat"
  | "unknown_response_option"
  | "unknown_session";

export interface OpenCharacterSessionInput {
  readonly sessionId: string;
  readonly dialoguePack: DialoguePack;
}

export interface OpenCharacterSessionOutput {
  readonly sessionId: string;
  readonly scenarioId: string;
  readonly dialoguePackId: string;
  readonly startingBeatId: string;
  readonly characterLineId: string;
  readonly visualState: CharacterVisualState;
  readonly source: "mock_fixture" | "provider";
}

export interface CharacterTurnInput {
  readonly sessionId: string;
  readonly turnId: string;
  readonly beatId: string;
  readonly responseOptionId: string;
}

export interface CharacterTurnOutput {
  readonly sessionId: string;
  readonly turnId: string;
  readonly scenarioId: string;
  readonly beatId: string;
  readonly responseOptionId: string;
  readonly characterLineId: string | null;
  readonly nextBeatId: string | null;
  readonly completed: boolean;
  readonly visualState: CharacterVisualState;
  readonly source: "mock_fixture" | "provider";
}

export type CharacterConversationResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; errorCode: CharacterConversationFailureCode }>;

export interface CharacterConversationPort {
  open(
    input: OpenCharacterSessionInput,
  ): Promise<CharacterConversationResult<OpenCharacterSessionOutput>>;
  close(sessionId: string): Promise<void>;
  respond(
    input: CharacterTurnInput,
  ): Promise<CharacterConversationResult<CharacterTurnOutput>>;
}
