import type { Locale, ValidationStatus } from "@/domain/content/types";

export const feedbackCategories = [
  "natural_target_usage",
  "cross_dialect_transfer",
  "msa_or_excessive_formality",
  "correct_but_locally_unnatural",
  "vocabulary_error",
  "grammar_error",
  "unclear_meaning",
  "pronunciation_issue",
] as const;

export type FeedbackCategory = (typeof feedbackCategories)[number];

export const evaluationCategoryAliases = {
  CORRECT_BUT_UNNATURAL: "correct_but_locally_unnatural",
  GRAMMAR_ERROR: "grammar_error",
  MSA_OVERUSE: "msa_or_excessive_formality",
  NATURAL_TARGET_DIALECT: "natural_target_usage",
  OTHER_DIALECT_TRANSFER: "cross_dialect_transfer",
  UNCLEAR: "unclear_meaning",
  VOCABULARY_ERROR: "vocabulary_error",
} as const satisfies Readonly<Record<string, FeedbackCategory>>;

export const learnerStartingPointKinds = [
  "beginner",
  "msa_learner",
  "dialect_learner",
  "heritage_or_partial",
] as const;

export type LearnerStartingPointKind = (typeof learnerStartingPointKinds)[number];

export const sourceDialectConfidences = ["HIGH", "MEDIUM", "LOW", "UNKNOWN"] as const;

export type SourceDialectConfidence = (typeof sourceDialectConfidences)[number];

export interface LearnerStartingPoint {
  readonly kind: LearnerStartingPointKind;
  readonly knownVarietyId?: string;
}

export interface LearnerSupportProfile {
  readonly translation: "always" | "on_request";
  readonly transliteration: "available" | "hidden";
  readonly phraseHints: "proactive" | "on_request";
  readonly vocabularyPreview: boolean;
  readonly expectedResponseComplexity: "modeled_phrase" | "short_phrase" | "open_short_response";
  readonly correctionDepth: "minimal" | "contextual";
  readonly comparisonMode: "none" | "msa_to_spoken" | "cross_dialect" | "naturalness";
}

export interface KnownConcept {
  readonly conceptId: string;
  readonly variantIds: readonly string[];
  readonly state: "encountered" | "practised" | "used";
  readonly lastEventAt?: string;
}

export type DurableLearningEvent =
  | Readonly<{
      id: string;
      type: "scenario_completed";
      scenarioId: string;
      occurredAt: string;
    }>
  | Readonly<{
      id: string;
      type: "turn_evaluated";
      destinationId: string;
      scenarioId: string;
      learnerStartingPoint: LearnerStartingPointKind;
      conceptId: string;
      evaluationCategory: FeedbackCategory;
      targetDialectId: string;
      likelySourceDialectId?: string;
      sourceDialectConfidence?: SourceDialectConfidence;
      matchedVariantId?: string;
      suggestedAlternativeId?: string;
      understood: boolean;
      retryAttempted: boolean;
      retrySuccess: boolean;
      validationStatus: ValidationStatus;
      occurredAt: string;
    }>
  | Readonly<{
      id: string;
      type: "feedback_observed";
      scenarioId: string;
      category: FeedbackCategory;
      conceptId: string;
      referenceIds: readonly string[];
      occurredAt: string;
    }>
  | Readonly<{
      id: string;
      type: "retry_completed";
      scenarioId: string;
      conceptId: string;
      outcome: "continued" | "successful";
      evaluationEventId: string;
      occurredAt: string;
    }>;

export interface LearningEvent extends Omit<Extract<DurableLearningEvent, { type: "turn_evaluated" }>, "retryAttempted" | "retrySuccess"> {
  readonly learnerInput: string;
  readonly normalizedInput: string;
  readonly retryAttempted: boolean;
  readonly retrySuccess: boolean;
}

export interface LearnerProfile {
  readonly schemaVersion: 2;
  readonly id: "local-prototype";
  readonly onboardingStatus: "configured" | "unconfigured";
  readonly startingPoint: LearnerStartingPoint | null;
  readonly support: LearnerSupportProfile;
  readonly preferredLocale: Locale;
  readonly knownConcepts: readonly KnownConcept[];
  readonly learningEvents: readonly DurableLearningEvent[];
  readonly persistOnDevice: boolean;
  readonly updatedAt: string;
}

export interface VersionedContentReference {
  readonly id: string;
  readonly version: number;
  readonly validationStatus: ValidationStatus;
}

export interface EvaluationCandidate {
  readonly category: FeedbackCategory;
  readonly runtimeConfidence: number;
  readonly references: readonly VersionedContentReference[];
  readonly suppressionReason?: string;
}

export interface EvaluationResult {
  readonly id: string;
  readonly turnId: string;
  readonly scenarioId: string;
  readonly targetDialectId: string;
  readonly understood: boolean;
  readonly category: FeedbackCategory;
  readonly likelySourceDialectId?: string;
  readonly learnerInput: string;
  readonly normalizedInput: string;
  readonly naturalAlternative: string | null;
  readonly explanation: string;
  readonly comparison: string | null;
  readonly learningConceptId?: string;
  readonly confidence: number;
  readonly validationStatus: ValidationStatus;
  readonly inputMode: "audio" | "scripted" | "text";
  readonly candidates: readonly EvaluationCandidate[];
  readonly primaryCandidate: EvaluationCandidate | null;
  readonly priority: "p0" | "p1" | "p2" | "p3" | null;
  readonly intervention: "clarification" | "guide" | "none";
  readonly retryRecommended: boolean;
  readonly uncertaintyReason?: string;
}
