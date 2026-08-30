import { normalizeLearnerInput } from "@/application/evaluation/normalize-learner-input";
import type {
  CrossDialectTransferRule,
  DialectVariant,
  ReviewMetadata,
} from "@/domain/content/types";
import type {
  EvaluationCandidate,
  EvaluationResult,
  LearnerProfile,
  VersionedContentReference,
} from "@/domain/learning/types";

const maximumRetryPromptsPerIssue = 1;
const uncertaintyExplanation =
  "MANARA isn't confident enough to classify this expression.";

type PublishedReviewRecord = ReviewMetadata & {
  readonly publicationStatus: "disabled" | "enabled";
};

export interface DeterministicEvaluatorContent {
  readonly transferRules: readonly CrossDialectTransferRule[];
  readonly variants: readonly DialectVariant[];
}

export interface EvaluateLearnerTurnInput {
  readonly evaluationId: string;
  readonly turnId: string;
  readonly scenarioId: string;
  readonly targetDialectId: string;
  readonly inputMode: EvaluationResult["inputMode"];
  readonly learnerInput: string;
  readonly learnerProfile: LearnerProfile;
  readonly retryAttemptCount?: number;
}

interface EligibleTransfer {
  readonly rule: CrossDialectTransferRule;
  readonly source: DialectVariant;
  readonly target: DialectVariant;
}

export function isPublishableLinguisticRecord(
  record: PublishedReviewRecord,
): boolean {
  return (
    record.validationStatus === "verified" &&
    record.publicationStatus === "enabled" &&
    Number.isInteger(record.version) &&
    record.version > 0 &&
    record.evidenceIds.length > 0 &&
    record.evidenceIds.every((id) => id.trim().length > 0) &&
    record.reviewerIds.length > 0 &&
    record.reviewerIds.every((id) => id.trim().length > 0) &&
    typeof record.reviewedAt === "string" &&
    record.reviewedAt.trim().length > 0
  );
}

function toReference(record: ReviewMetadata & { readonly id: string }): VersionedContentReference {
  return {
    id: record.id,
    version: record.version,
    validationStatus: record.validationStatus,
  };
}

function variantMatches(variant: DialectVariant, normalizedInput: string): boolean {
  const matchForms = [variant.surfaceAr, ...variant.matchForms];

  return matchForms.some((form) => {
    const normalizedForm = normalizeLearnerInput(form);
    return normalizedForm.length > 0 && normalizedForm === normalizedInput;
  });
}

function hasRelevantLearnerHistory(
  profile: LearnerProfile,
  source: DialectVariant,
): boolean {
  const knownConceptMatch = profile.knownConcepts.some(
    (knownConcept) =>
      knownConcept.conceptId === source.conceptId &&
      knownConcept.variantIds.includes(source.id),
  );

  if (knownConceptMatch) return true;

  const startingPoint = profile.startingPoint;
  return (
    (startingPoint?.kind === "dialect_learner" ||
      startingPoint?.kind === "heritage_or_partial") &&
    startingPoint.knownVarietyId === source.dialectId
  );
}

function getEligibleTransfers(
  content: DeterministicEvaluatorContent,
  scenarioId: string,
  targetDialectId: string,
): readonly EligibleTransfer[] {
  const publishableVariants = new Map<string, DialectVariant>();
  const duplicateVariantIds = new Set<string>();

  for (const variant of content.variants.filter(isPublishableLinguisticRecord)) {
    if (publishableVariants.has(variant.id)) {
      duplicateVariantIds.add(variant.id);
      continue;
    }
    publishableVariants.set(variant.id, variant);
  }

  for (const duplicateId of duplicateVariantIds) {
    publishableVariants.delete(duplicateId);
  }

  return content.transferRules.flatMap((rule): EligibleTransfer[] => {
    if (
      !isPublishableLinguisticRecord(rule) ||
      !rule.targetScenarioIds.includes(scenarioId) ||
      !rule.explanationKey.trim()
    ) {
      return [];
    }

    const source = publishableVariants.get(rule.sourceVariantId);
    const target = publishableVariants.get(rule.targetVariantId);

    if (
      !source ||
      !target ||
      source.conceptId !== rule.conceptId ||
      target.conceptId !== rule.conceptId ||
      target.dialectId !== targetDialectId ||
      !target.scenarioIds.includes(scenarioId)
    ) {
      return [];
    }

    return [{ rule, source, target }];
  });
}

function createCandidate(
  category: EvaluationCandidate["category"],
  references: readonly VersionedContentReference[],
): EvaluationCandidate {
  return {
    category,
    runtimeConfidence: 1,
    references,
  };
}

function createUncertainResult(
  input: EvaluateLearnerTurnInput,
  normalizedInput: string,
  reason: "ambiguous_verified_match" | "no_relevant_learner_history" | "no_verified_match",
): EvaluationResult {
  return {
    id: input.evaluationId,
    turnId: input.turnId,
    scenarioId: input.scenarioId,
    targetDialectId: input.targetDialectId,
    understood: false,
    category: "unclear_meaning",
    learnerInput: input.learnerInput,
    normalizedInput,
    naturalAlternative: null,
    explanation: uncertaintyExplanation,
    comparison: null,
    confidence: 0,
    validationStatus: "needs_review",
    inputMode: input.inputMode,
    candidates: [],
    primaryCandidate: null,
    priority: "p0",
    intervention: "clarification",
    retryRecommended: false,
    uncertaintyReason: reason,
  };
}

function createNaturalTargetResult(
  input: EvaluateLearnerTurnInput,
  normalizedInput: string,
  variant: DialectVariant,
): EvaluationResult {
  const candidate = createCandidate("natural_target_usage", [toReference(variant)]);

  return {
    id: input.evaluationId,
    turnId: input.turnId,
    scenarioId: input.scenarioId,
    targetDialectId: input.targetDialectId,
    understood: true,
    category: candidate.category,
    learnerInput: input.learnerInput,
    normalizedInput,
    naturalAlternative: null,
    explanation: "The response matches an approved target-context form.",
    comparison: null,
    learningConceptId: variant.conceptId,
    confidence: candidate.runtimeConfidence,
    validationStatus: "verified",
    inputMode: input.inputMode,
    candidates: [candidate],
    primaryCandidate: candidate,
    priority: null,
    intervention: "none",
    retryRecommended: false,
  };
}

function createFormalRegisterResult(
  input: EvaluateLearnerTurnInput,
  normalizedInput: string,
  variant: DialectVariant,
  alternative: DialectVariant | undefined,
): EvaluationResult {
  const references = alternative
    ? [toReference(variant), toReference(alternative)]
    : [toReference(variant)];
  const candidate = createCandidate("msa_or_excessive_formality", references);
  const retryRecommended =
    Boolean(alternative) &&
    Math.max(0, input.retryAttemptCount ?? 0) < maximumRetryPromptsPerIssue;

  return {
    id: input.evaluationId,
    turnId: input.turnId,
    scenarioId: input.scenarioId,
    targetDialectId: input.targetDialectId,
    understood: true,
    category: candidate.category,
    ...(variant.dialectId !== input.targetDialectId
      ? { likelySourceDialectId: variant.dialectId }
      : {}),
    learnerInput: input.learnerInput,
    normalizedInput,
    naturalAlternative: alternative?.surfaceAr ?? null,
    explanation:
      "You were understood. This reviewed form is valid but more formal in this situation.",
    comparison: alternative
      ? `${variant.surfaceAr} → ${alternative.surfaceAr}`
      : null,
    learningConceptId: variant.conceptId,
    confidence: candidate.runtimeConfidence,
    validationStatus: "verified",
    inputMode: input.inputMode,
    candidates: [candidate],
    primaryCandidate: candidate,
    priority: "p2",
    intervention: "guide",
    retryRecommended,
  };
}

function createTransferResult(
  input: EvaluateLearnerTurnInput,
  normalizedInput: string,
  transfer: EligibleTransfer,
): EvaluationResult {
  const references = [
    toReference(transfer.source),
    toReference(transfer.target),
    toReference(transfer.rule),
  ];
  const candidate = createCandidate("cross_dialect_transfer", references);
  const retryRecommended =
    Math.max(0, input.retryAttemptCount ?? 0) < maximumRetryPromptsPerIssue;

  return {
    id: input.evaluationId,
    turnId: input.turnId,
    scenarioId: input.scenarioId,
    targetDialectId: input.targetDialectId,
    understood: true,
    category: candidate.category,
    likelySourceDialectId: transfer.source.dialectId,
    learnerInput: input.learnerInput,
    normalizedInput,
    naturalAlternative: transfer.target.surfaceAr,
    explanation:
      "You were understood. This reviewed form can transfer into the current speech context.",
    comparison: `${transfer.source.surfaceAr} → ${transfer.target.surfaceAr}`,
    learningConceptId: transfer.rule.conceptId,
    confidence: candidate.runtimeConfidence,
    validationStatus: "verified",
    inputMode: input.inputMode,
    candidates: [candidate],
    primaryCandidate: candidate,
    priority: "p2",
    intervention: "guide",
    retryRecommended,
  };
}

/**
 * Evaluates only exact, explicitly authored matches. Unknown or ambiguous input
 * follows the uncertainty path; absence from the injected data is never an
 * error, dialect attribution, or pronunciation judgment.
 */
export function evaluateLearnerTurn(
  content: DeterministicEvaluatorContent,
  input: EvaluateLearnerTurnInput,
): EvaluationResult {
  const normalizedInput = normalizeLearnerInput(input.learnerInput);
  if (!normalizedInput) {
    return createUncertainResult(input, normalizedInput, "no_verified_match");
  }

  const publishableContextVariants = content.variants.filter(
    (variant) =>
      isPublishableLinguisticRecord(variant) &&
      variant.scenarioIds.includes(input.scenarioId),
  );
  const naturalTargetVariants = publishableContextVariants.filter(
    (variant) =>
      variant.dialectId === input.targetDialectId && variant.register !== "formal",
  );
  const naturalTargetMatches = naturalTargetVariants.filter((variant) =>
    variantMatches(variant, normalizedInput),
  );

  if (naturalTargetMatches.length === 1) {
    return createNaturalTargetResult(input, normalizedInput, naturalTargetMatches[0]!);
  }
  if (naturalTargetMatches.length > 1) {
    return createUncertainResult(input, normalizedInput, "ambiguous_verified_match");
  }

  const formalVariants = publishableContextVariants.filter(
    (variant) => variant.register === "formal",
  );
  const formalMatches = formalVariants.filter((variant) =>
    variantMatches(variant, normalizedInput),
  );

  if (formalMatches.length === 1) {
    const formalMatch = formalMatches[0]!;
    const alternatives = naturalTargetVariants.filter(
      (variant) => variant.conceptId === formalMatch.conceptId,
    );
    const alternative = alternatives.length === 1 ? alternatives[0] : undefined;
    return createFormalRegisterResult(input, normalizedInput, formalMatch, alternative);
  }
  if (formalMatches.length > 1) {
    return createUncertainResult(input, normalizedInput, "ambiguous_verified_match");
  }

  const transfers = getEligibleTransfers(
    content,
    input.scenarioId,
    input.targetDialectId,
  ).filter((transfer) => variantMatches(transfer.source, normalizedInput));

  if (transfers.length > 1) {
    return createUncertainResult(input, normalizedInput, "ambiguous_verified_match");
  }

  const transfer = transfers[0];
  if (transfer) {
    if (!hasRelevantLearnerHistory(input.learnerProfile, transfer.source)) {
      return createUncertainResult(
        input,
        normalizedInput,
        "no_relevant_learner_history",
      );
    }

    return createTransferResult(input, normalizedInput, transfer);
  }

  return createUncertainResult(input, normalizedInput, "no_verified_match");
}
