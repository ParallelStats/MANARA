import { deriveLearnerSupport } from "@/application/learning/derive-learner-support";
import type { Locale } from "@/domain/content/types";
import type {
  DurableLearningEvent,
  KnownConcept,
  LearnerProfile,
  LearnerStartingPoint,
  LearningEvent,
} from "@/domain/learning/types";

export interface ConfigureLearnerProfileInput {
  readonly startingPoint: LearnerStartingPoint;
  readonly updatedAt: string;
  readonly preferredLocale?: Locale;
  readonly persistOnDevice?: boolean;
}

export interface RecordRetryOutcomeInput {
  readonly evaluationEventId: string;
  readonly eventId: string;
  readonly outcome: "continued" | "successful";
  readonly occurredAt: string;
}

export type LearnerProfileAction =
  | Readonly<{ type: "configure"; input: ConfigureLearnerProfileInput }>
  | Readonly<{ type: "record_evaluation"; event: LearningEvent }>
  | Readonly<{ type: "record_event"; event: DurableLearningEvent }>
  | Readonly<{ type: "record_retry"; input: RecordRetryOutcomeInput }>
  | Readonly<{ type: "set_persistence"; enabled: boolean; updatedAt: string }>;

const conceptStateRank: Readonly<Record<KnownConcept["state"], number>> = {
  encountered: 0,
  practised: 1,
  used: 2,
};

function normalizeStartingPoint(startingPoint: LearnerStartingPoint): LearnerStartingPoint {
  if (startingPoint.kind !== "dialect_learner") {
    return { kind: startingPoint.kind };
  }

  const knownVarietyId = startingPoint.knownVarietyId?.trim();
  return {
    kind: "dialect_learner",
    ...(knownVarietyId ? { knownVarietyId } : {}),
  };
}

function laterTimestamp(first: string | undefined, second: string) {
  return first && first > second ? first : second;
}

function mergeKnownConcept(
  concepts: readonly KnownConcept[],
  conceptId: string,
  variantIds: readonly string[],
  state: KnownConcept["state"],
  occurredAt: string,
): readonly KnownConcept[] {
  const existing = concepts.find((concept) => concept.conceptId === conceptId);
  if (!existing) {
    return [
      ...concepts,
      {
        conceptId,
        variantIds: [...new Set(variantIds.filter(Boolean))],
        state,
        lastEventAt: occurredAt,
      },
    ];
  }

  const mergedState = conceptStateRank[state] > conceptStateRank[existing.state]
    ? state
    : existing.state;
  const mergedVariants = [...new Set([...existing.variantIds, ...variantIds.filter(Boolean)])];
  const merged: KnownConcept = {
    conceptId,
    variantIds: mergedVariants,
    state: mergedState,
    lastEventAt: laterTimestamp(existing.lastEventAt, occurredAt),
  };

  return concepts.map((concept) => concept.conceptId === conceptId ? merged : concept);
}

function deriveKnownConcepts(
  profile: LearnerProfile,
  event: DurableLearningEvent,
): readonly KnownConcept[] {
  if (event.type === "scenario_completed") return profile.knownConcepts;

  if (event.type === "turn_evaluated") {
    const variantIds = [
      ...(event.matchedVariantId ? [event.matchedVariantId] : []),
      ...(event.retrySuccess && event.suggestedAlternativeId
        ? [event.suggestedAlternativeId]
        : []),
    ];

    return mergeKnownConcept(
      profile.knownConcepts,
      event.conceptId,
      variantIds,
      event.understood ? "used" : "encountered",
      event.occurredAt,
    );
  }

  if (event.type === "feedback_observed") {
    return mergeKnownConcept(
      profile.knownConcepts,
      event.conceptId,
      [],
      "encountered",
      event.occurredAt,
    );
  }

  const evaluation = profile.learningEvents.find(
    (candidate): candidate is Extract<DurableLearningEvent, { type: "turn_evaluated" }> =>
      candidate.type === "turn_evaluated" && candidate.id === event.evaluationEventId,
  );

  return mergeKnownConcept(
    profile.knownConcepts,
    event.conceptId,
    event.outcome === "successful" && evaluation?.suggestedAlternativeId
      ? [evaluation.suggestedAlternativeId]
      : [],
    event.outcome === "successful" ? "used" : "practised",
    event.occurredAt,
  );
}

export function configureLearnerProfile(
  profile: LearnerProfile,
  input: ConfigureLearnerProfileInput,
): LearnerProfile {
  const startingPoint = normalizeStartingPoint(input.startingPoint);

  return {
    ...profile,
    onboardingStatus: "configured",
    startingPoint,
    support: deriveLearnerSupport(startingPoint),
    preferredLocale: input.preferredLocale ?? profile.preferredLocale,
    persistOnDevice: input.persistOnDevice ?? profile.persistOnDevice,
    updatedAt: input.updatedAt,
  };
}

export function toDurableLearningEvent(event: LearningEvent): DurableLearningEvent {
  return {
    id: event.id,
    type: "turn_evaluated",
    destinationId: event.destinationId,
    scenarioId: event.scenarioId,
    learnerStartingPoint: event.learnerStartingPoint,
    conceptId: event.conceptId,
    evaluationCategory: event.evaluationCategory,
    targetDialectId: event.targetDialectId,
    ...(event.likelySourceDialectId
      ? { likelySourceDialectId: event.likelySourceDialectId }
      : {}),
    ...(event.sourceDialectConfidence
      ? { sourceDialectConfidence: event.sourceDialectConfidence }
      : {}),
    ...(event.matchedVariantId ? { matchedVariantId: event.matchedVariantId } : {}),
    ...(event.suggestedAlternativeId
      ? { suggestedAlternativeId: event.suggestedAlternativeId }
      : {}),
    understood: event.understood,
    retryAttempted: event.retryAttempted,
    retrySuccess: event.retrySuccess,
    validationStatus: event.validationStatus,
    occurredAt: event.occurredAt,
  };
}

export function recordDurableLearningEvent(
  profile: LearnerProfile,
  event: DurableLearningEvent,
): LearnerProfile {
  if (profile.learningEvents.some(({ id }) => id === event.id)) return profile;

  return {
    ...profile,
    knownConcepts: deriveKnownConcepts(profile, event),
    learningEvents: [...profile.learningEvents, event],
    updatedAt: laterTimestamp(profile.updatedAt, event.occurredAt),
  };
}

export function recordLearningEvent(
  profile: LearnerProfile,
  event: LearningEvent,
): LearnerProfile {
  return recordDurableLearningEvent(profile, toDurableLearningEvent(event));
}

export function recordRetryOutcome(
  profile: LearnerProfile,
  input: RecordRetryOutcomeInput,
): LearnerProfile {
  const evaluation = profile.learningEvents.find(
    (event): event is Extract<DurableLearningEvent, { type: "turn_evaluated" }> =>
      event.type === "turn_evaluated" && event.id === input.evaluationEventId,
  );
  if (!evaluation) return profile;

  const existingRetry = profile.learningEvents.find(({ id }) => id === input.eventId);
  if (existingRetry) return profile;

  const learningEvents = profile.learningEvents.map((event) =>
    event.id === evaluation.id
      ? {
          ...evaluation,
          retryAttempted: true,
          retrySuccess: input.outcome === "successful",
        }
      : event,
  );
  const updatedProfile: LearnerProfile = { ...profile, learningEvents };

  return recordDurableLearningEvent(updatedProfile, {
    id: input.eventId,
    type: "retry_completed",
    scenarioId: evaluation.scenarioId,
    conceptId: evaluation.conceptId,
    outcome: input.outcome,
    evaluationEventId: evaluation.id,
    occurredAt: input.occurredAt,
  });
}

export function learnerProfileReducer(
  profile: LearnerProfile,
  action: LearnerProfileAction,
): LearnerProfile {
  switch (action.type) {
    case "configure":
      return configureLearnerProfile(profile, action.input);
    case "record_evaluation":
      return recordLearningEvent(profile, action.event);
    case "record_event":
      return recordDurableLearningEvent(profile, action.event);
    case "record_retry":
      return recordRetryOutcome(profile, action.input);
    case "set_persistence":
      return {
        ...profile,
        persistOnDevice: action.enabled,
        updatedAt: action.updatedAt,
      };
  }
}
