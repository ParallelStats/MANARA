import type {
  DialogueBeat,
  DialoguePack,
  LearnerResponseOption,
} from "@/domain/scenario/types";
import type { EvaluationResult } from "@/domain/learning/types";
import { normalizeLearnerInput } from "@/application/evaluation/normalize-learner-input";

export type DialogueAdvance =
  | Readonly<{ kind: "complete" }>
  | Readonly<{ beat: DialogueBeat; kind: "next_beat" }>
  | Readonly<{ kind: "recoverable_error"; message: string }>;

export function getDialogueBeat(pack: DialoguePack, beatId: string) {
  return pack.beats.find((beat) => beat.id === beatId);
}

const interactionPunctuation = /[.,!?;:،؛؟"'()[\]{}]/gu;
const optionalCourtesyTokens = new Set(["لو", "سمحت", "من", "فضلك", "please"]);

function interactionTokens(value: string) {
  return normalizeLearnerInput(value)
    .replace(interactionPunctuation, " ")
    .split(/\s+/u)
    .filter((token) => token && !optionalCourtesyTokens.has(token.toLocaleLowerCase("en")));
}

function isOrderedSubset(needles: readonly string[], haystack: readonly string[]) {
  let cursor = 0;
  for (const token of haystack) {
    if (token === needles[cursor]) cursor += 1;
    if (cursor === needles.length) return true;
  }
  return false;
}

/**
 * Resolves a learner's conversational wording to one authored option without
 * making a linguistic classification. Exact matches win; otherwise one unique
 * option may match when its meaningful words are an ordered subset of the
 * learner's wording (or vice versa). Ambiguous and unrelated input stays null.
 */
export function resolveDeterministicResponseOption(
  learnerInput: string,
  options: readonly LearnerResponseOption[],
) {
  const normalizedInput = normalizeLearnerInput(learnerInput);
  const exactMatch = options.find(
    ({ arabicText }) => normalizeLearnerInput(arabicText) === normalizedInput,
  );
  if (exactMatch) return exactMatch;

  const learnerTokens = interactionTokens(learnerInput);
  if (learnerTokens.length === 0) return null;

  const matches = options.filter((option) => {
    const optionTokens = interactionTokens(option.arabicText);
    if (optionTokens.length === 0) return false;
    return isOrderedSubset(learnerTokens, optionTokens)
      || isOrderedSubset(optionTokens, learnerTokens);
  });

  return matches.length === 1 ? matches[0] ?? null : null;
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
