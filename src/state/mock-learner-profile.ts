import type { LearnerProfile } from "@/domain/learning/types";

export function createMockLearnerProfile(updatedAt = "1970-01-01T00:00:00.000Z"): LearnerProfile {
  return {
    schemaVersion: 2,
    id: "local-prototype",
    onboardingStatus: "unconfigured",
    startingPoint: null,
    support: {
      translation: "always",
      transliteration: "available",
      phraseHints: "proactive",
      vocabularyPreview: true,
      expectedResponseComplexity: "modeled_phrase",
      correctionDepth: "minimal",
      comparisonMode: "none",
    },
    preferredLocale: "en",
    knownConcepts: [],
    learningEvents: [],
    persistOnDevice: true,
    updatedAt,
  };
}
