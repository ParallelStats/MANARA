import type {
  LearnerStartingPoint,
  LearnerSupportProfile,
} from "@/domain/learning/types";

const supportByStartingPoint = {
  beginner: {
    translation: "always",
    transliteration: "available",
    phraseHints: "proactive",
    vocabularyPreview: true,
    expectedResponseComplexity: "modeled_phrase",
    correctionDepth: "minimal",
    comparisonMode: "none",
  },
  msa_learner: {
    translation: "on_request",
    transliteration: "available",
    phraseHints: "on_request",
    vocabularyPreview: true,
    expectedResponseComplexity: "short_phrase",
    correctionDepth: "contextual",
    comparisonMode: "msa_to_spoken",
  },
  dialect_learner: {
    translation: "on_request",
    transliteration: "hidden",
    phraseHints: "on_request",
    vocabularyPreview: false,
    expectedResponseComplexity: "open_short_response",
    correctionDepth: "contextual",
    comparisonMode: "cross_dialect",
  },
  heritage_or_partial: {
    translation: "on_request",
    transliteration: "hidden",
    phraseHints: "on_request",
    vocabularyPreview: true,
    expectedResponseComplexity: "open_short_response",
    correctionDepth: "contextual",
    comparisonMode: "naturalness",
  },
} as const satisfies Readonly<Record<LearnerStartingPoint["kind"], LearnerSupportProfile>>;

export function deriveLearnerSupport(
  startingPoint: LearnerStartingPoint,
): LearnerSupportProfile {
  return { ...supportByStartingPoint[startingPoint.kind] };
}
