import type { LocalizedText, ReviewMetadata } from "@/domain/content/types";

export const characterVisualStates = [
  "idle",
  "listening",
  "thinking",
  "speaking",
  "positive_reaction",
  "clarification_reaction",
] as const;

export type CharacterVisualState = (typeof characterVisualStates)[number];

export type LearnerResponseKind =
  | "beginner_model"
  | "clarification"
  | "msa"
  | "source_dialect"
  | "target_dialect"
  | "unknown";

export interface DialogueLine extends ReviewMetadata {
  readonly id: string;
  readonly scenarioId: string;
  readonly characterId: string;
  readonly speaker: "local_character";
  readonly arabicText: string;
  readonly englishMeaning: string;
  readonly transliteration?: string;
  readonly dialectOrRegister: string;
  readonly communicativeIntent: string;
  readonly linguisticNotes: string;
  readonly reviewerNote: string;
}

export interface LearnerResponseOption extends ReviewMetadata {
  readonly id: string;
  readonly scenarioId: string;
  readonly beatId: string;
  readonly arabicText: string;
  readonly englishMeaning: string;
  readonly transliteration?: string;
  readonly dialectOrRegister: string;
  readonly communicativeIntent: string;
  readonly kind: LearnerResponseKind;
  readonly learningConceptId: string;
  readonly variantId?: string;
  readonly nextBeatId?: string;
  readonly completesScenario?: boolean;
  readonly linguisticNotes: string;
  readonly reviewerNote: string;
}

export interface DialogueVocabularyItem extends ReviewMetadata {
  readonly id: string;
  readonly arabic: string;
  readonly english: string;
  readonly transliteration?: string;
  readonly reviewerNote: string;
}

export interface DialogueBeat extends ReviewMetadata {
  readonly id: string;
  readonly scenarioId: string;
  readonly sequence: number;
  readonly characterLine: DialogueLine;
  readonly prompt: LocalizedText;
  readonly responseOptions: readonly LearnerResponseOption[];
  readonly hint: LocalizedText;
  readonly vocabulary: readonly DialogueVocabularyItem[];
  readonly isCompletionBeat?: boolean;
}

export interface DialoguePack extends ReviewMetadata {
  readonly id: string;
  readonly scenarioId: string;
  readonly characterId: string;
  readonly environmentId: string;
  readonly title: LocalizedText;
  readonly startingBeatId: string;
  readonly beats: readonly DialogueBeat[];
  readonly publicationStatus: "disabled" | "enabled";
}

export interface ScenarioEnvironment extends ReviewMetadata {
  readonly id: string;
  readonly scenarioId: string;
  readonly visualId: string;
  readonly label: LocalizedText;
  readonly atmosphere: LocalizedText;
  readonly ambientMotion: "city_flow" | "courtyard_light" | "cafe_glow" | "street_motion";
}
