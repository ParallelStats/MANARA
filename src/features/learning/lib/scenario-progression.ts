import type {
  DialogueBeat,
  DialoguePack,
  LearnerResponseOption,
} from "@/domain/scenario/types";
import type { EvaluationResult } from "@/domain/learning/types";

export type DialogueAdvance =
  | Readonly<{ kind: "complete" }>
  | Readonly<{ beat: DialogueBeat; kind: "next_beat" }>
  | Readonly<{ kind: "recoverable_error"; message: string }>;

export function getDialogueBeat(pack: DialoguePack, beatId: string) {
  return pack.beats.find((beat) => beat.id === beatId);
}

export function resolveDialogueAdvance(
  pack: DialoguePack,
  currentBeat: DialogueBeat,
  option: LearnerResponseOption,
): DialogueAdvance {
  if (option.scenarioId !== pack.scenarioId || option.beatId !== currentBeat.id) {
    return {
      kind: "recoverable_error",
      message: "That response no longer belongs to this moment in the conversation.",
    };
  }

  if (option.completesScenario) return { kind: "complete" };
  if (!option.nextBeatId) {
    return {
      kind: "recoverable_error",
      message: "The conversation cannot find its next moment.",
    };
  }

  const nextBeat = getDialogueBeat(pack, option.nextBeatId);
  return nextBeat
    ? { kind: "next_beat", beat: nextBeat }
    : {
        kind: "recoverable_error",
        message: "The next moment in the conversation is unavailable.",
      };
}

export function shouldShowGuideForTurn(
  evaluation: EvaluationResult,
  option: LearnerResponseOption | null,
) {
  if (evaluation.validationStatus === "verified") {
    return evaluation.intervention !== "none";
  }

  return option === null ||
    option.kind === "msa" ||
    option.kind === "source_dialect" ||
    option.kind === "unknown";
}
