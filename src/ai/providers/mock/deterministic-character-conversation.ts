import type {
  CharacterConversationFailureCode,
  CharacterConversationPort,
  CharacterConversationResult,
  CharacterTurnInput,
  CharacterTurnOutput,
  OpenCharacterSessionInput,
  OpenCharacterSessionOutput,
} from "@/ai/ports/character-conversation";
import type {
  CharacterVisualState,
  DialoguePack,
  LearnerResponseKind,
} from "@/domain/scenario/types";

interface TransitionSnapshot {
  readonly responseOptionId: string;
  readonly nextBeatId: string | null;
  readonly completesScenario: boolean;
  readonly responseKind: LearnerResponseKind;
}

interface BeatSnapshot {
  readonly id: string;
  readonly characterLineId: string;
  readonly transitions: ReadonlyMap<string, TransitionSnapshot>;
}

interface DialoguePackSnapshot {
  readonly id: string;
  readonly scenarioId: string;
  readonly startingBeatId: string;
  readonly beats: ReadonlyMap<string, BeatSnapshot>;
}

interface SessionRecord {
  readonly snapshot: DialoguePackSnapshot;
  readonly completedTurnIds: Set<string>;
  currentBeatId: string;
  completed: boolean;
}

export interface DeterministicCharacterConversationOptions {
  readonly failOnTurnIds?: readonly string[];
}

function failure<T>(
  errorCode: CharacterConversationFailureCode,
): CharacterConversationResult<T> {
  return { ok: false, errorCode };
}

function snapshotDialoguePack(pack: DialoguePack): DialoguePackSnapshot | undefined {
  if (
    !pack.id.trim() ||
    !pack.scenarioId.trim() ||
    !pack.characterId.trim() ||
    !pack.startingBeatId.trim() ||
    pack.beats.length === 0
  ) {
    return undefined;
  }

  const beatIds = new Set<string>();
  const characterLineIds = new Set<string>();
  const responseOptionIds = new Set<string>();
  const beats = new Map<string, BeatSnapshot>();

  for (const beat of pack.beats) {
    if (
      !beat.id.trim() ||
      beatIds.has(beat.id) ||
      beat.scenarioId !== pack.scenarioId ||
      beat.characterLine.scenarioId !== pack.scenarioId ||
      beat.characterLine.characterId !== pack.characterId ||
      !beat.characterLine.id.trim() ||
      characterLineIds.has(beat.characterLine.id) ||
      beat.responseOptions.length === 0
    ) {
      return undefined;
    }

    beatIds.add(beat.id);
    characterLineIds.add(beat.characterLine.id);
    const transitions = new Map<string, TransitionSnapshot>();

    for (const option of beat.responseOptions) {
      const completesScenario = option.completesScenario === true;
      const hasNextBeat = typeof option.nextBeatId === "string";

      if (
        !option.id.trim() ||
        responseOptionIds.has(option.id) ||
        option.scenarioId !== pack.scenarioId ||
        option.beatId !== beat.id ||
        hasNextBeat === completesScenario
      ) {
        return undefined;
      }

      responseOptionIds.add(option.id);
      transitions.set(option.id, {
        responseOptionId: option.id,
        nextBeatId: option.nextBeatId ?? null,
        completesScenario,
        responseKind: option.kind,
      });
    }

    beats.set(beat.id, {
      id: beat.id,
      characterLineId: beat.characterLine.id,
      transitions,
    });
  }

  if (!beats.has(pack.startingBeatId)) return undefined;

  for (const beat of beats.values()) {
    for (const transition of beat.transitions.values()) {
      if (transition.nextBeatId && !beats.has(transition.nextBeatId)) {
        return undefined;
      }
    }
  }

  return {
    id: pack.id,
    scenarioId: pack.scenarioId,
    startingBeatId: pack.startingBeatId,
    beats,
  };
}

function visualStateFor(
  responseKind: LearnerResponseKind,
  completed: boolean,
): CharacterVisualState {
  if (completed || responseKind === "beginner_model" || responseKind === "target_dialect") {
    return "positive_reaction";
  }
  if (responseKind === "clarification" || responseKind === "unknown") {
    return "clarification_reaction";
  }
  return "speaking";
}

export function createDeterministicCharacterConversation(
  options: DeterministicCharacterConversationOptions = {},
): CharacterConversationPort {
  const sessions = new Map<string, SessionRecord>();
  const closedSessionIds = new Set<string>();
  const failureTurnIds = new Set(options.failOnTurnIds ?? []);

  return {
    async open(
      input: OpenCharacterSessionInput,
    ): Promise<CharacterConversationResult<OpenCharacterSessionOutput>> {
      if (closedSessionIds.has(input.sessionId)) {
        return failure("session_closed");
      }
      if (sessions.has(input.sessionId)) {
        return failure("duplicate_session");
      }

      const snapshot = snapshotDialoguePack(input.dialoguePack);
      const startingBeat = snapshot?.beats.get(snapshot.startingBeatId);
      if (!snapshot || !startingBeat || !input.sessionId.trim()) {
        return failure("invalid_dialogue_pack");
      }

      sessions.set(input.sessionId, {
        snapshot,
        completedTurnIds: new Set<string>(),
        currentBeatId: snapshot.startingBeatId,
        completed: false,
      });

      return {
        ok: true,
        value: {
          sessionId: input.sessionId,
          scenarioId: snapshot.scenarioId,
          dialoguePackId: snapshot.id,
          startingBeatId: snapshot.startingBeatId,
          characterLineId: startingBeat.characterLineId,
          visualState: "speaking",
          source: "mock_fixture",
        },
      };
    },

    async respond(
      input: CharacterTurnInput,
    ): Promise<CharacterConversationResult<CharacterTurnOutput>> {
      const session = sessions.get(input.sessionId);
      if (!session) {
        return failure(
          closedSessionIds.has(input.sessionId) ? "session_closed" : "unknown_session",
        );
      }
      if (session.completedTurnIds.has(input.turnId)) {
        return failure("duplicate_turn");
      }
      if (session.completed) {
        return failure("session_completed");
      }
      if (input.beatId !== session.currentBeatId) {
        return failure("stale_beat");
      }

      const beat = session.snapshot.beats.get(session.currentBeatId);
      const transition = beat?.transitions.get(input.responseOptionId);
      if (!beat || !transition) {
        return failure("unknown_response_option");
      }
      if (failureTurnIds.has(input.turnId)) {
        return failure("mock_failure");
      }

      const nextBeat = transition.nextBeatId
        ? session.snapshot.beats.get(transition.nextBeatId)
        : undefined;
      if (transition.nextBeatId && !nextBeat) {
        return failure("invalid_dialogue_pack");
      }

      session.completedTurnIds.add(input.turnId);
      if (transition.completesScenario) {
        session.completed = true;
      } else if (nextBeat) {
        session.currentBeatId = nextBeat.id;
      }

      return {
        ok: true,
        value: {
          sessionId: input.sessionId,
          turnId: input.turnId,
          scenarioId: session.snapshot.scenarioId,
          beatId: beat.id,
          responseOptionId: transition.responseOptionId,
          characterLineId: nextBeat?.characterLineId ?? null,
          nextBeatId: transition.nextBeatId,
          completed: transition.completesScenario,
          visualState: visualStateFor(
            transition.responseKind,
            transition.completesScenario,
          ),
          source: "mock_fixture",
        },
      };
    },

    async close(sessionId: string): Promise<void> {
      if (sessions.delete(sessionId)) {
        closedSessionIds.add(sessionId);
      }
    },
  };
}
