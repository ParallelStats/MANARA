import type {
  DurableLearningEvent,
  FeedbackCategory,
  KnownConcept,
  LearnerProfile,
  LearnerStartingPoint,
  LearnerSupportProfile,
} from "@/domain/learning/types";
import {
  feedbackCategories,
  learnerStartingPointKinds,
  sourceDialectConfidences,
} from "@/domain/learning/types";
import { createMockLearnerProfile } from "@/state/mock-learner-profile";

export const learnerProfileStorageKey = "manara:learner-profile:v2";
export const legacyLearnerProfileStorageKey = "manara:learner-profile:v1";

export interface StorageLike {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

export interface LearnerProfileRepository {
  clear(): Promise<boolean>;
  load(): Promise<LearnerProfile>;
  save(profile: LearnerProfile): Promise<boolean>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readOptionalString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readStringArray(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    return undefined;
  }

  return [...new Set(value.filter(Boolean))];
}

function parseKnownConcept(value: unknown): KnownConcept | undefined {
  if (!isRecord(value)) return undefined;

  const conceptId = readString(value, "conceptId");
  const state = readString(value, "state");
  const variantIds = readStringArray(value.variantIds);
  const lastEventAt = readOptionalString(value, "lastEventAt");

  if (!conceptId || !variantIds || !["encountered", "practised", "used"].includes(state ?? "")) {
    return undefined;
  }

  return {
    conceptId,
    variantIds,
    state: state as KnownConcept["state"],
    ...(lastEventAt ? { lastEventAt } : {}),
  };
}

function parseStartingPoint(value: unknown): LearnerStartingPoint | null | undefined {
  if (value === null) return null;
  if (!isRecord(value)) return undefined;

  const kind = readString(value, "kind");
  if (!kind || !learnerStartingPointKinds.includes(kind as LearnerStartingPoint["kind"])) {
    return undefined;
  }

  if (kind !== "dialect_learner") {
    return { kind: kind as Exclude<LearnerStartingPoint["kind"], "dialect_learner"> };
  }

  const knownVarietyId = readOptionalString(value, "knownVarietyId");
  return {
    kind: "dialect_learner",
    ...(knownVarietyId ? { knownVarietyId } : {}),
  };
}

function parseSupport(value: unknown): LearnerSupportProfile | undefined {
  if (!isRecord(value)) return undefined;

  if (
    !["always", "on_request"].includes(String(value.translation)) ||
    !["available", "hidden"].includes(String(value.transliteration)) ||
    !["proactive", "on_request"].includes(String(value.phraseHints)) ||
    typeof value.vocabularyPreview !== "boolean" ||
    !["modeled_phrase", "short_phrase", "open_short_response"].includes(
      String(value.expectedResponseComplexity),
    ) ||
    !["minimal", "contextual"].includes(String(value.correctionDepth)) ||
    !["none", "msa_to_spoken", "cross_dialect", "naturalness"].includes(
      String(value.comparisonMode),
    )
  ) {
    return undefined;
  }

  return {
    translation: value.translation as LearnerSupportProfile["translation"],
    transliteration: value.transliteration as LearnerSupportProfile["transliteration"],
    phraseHints: value.phraseHints as LearnerSupportProfile["phraseHints"],
    vocabularyPreview: value.vocabularyPreview,
    expectedResponseComplexity:
      value.expectedResponseComplexity as LearnerSupportProfile["expectedResponseComplexity"],
    correctionDepth: value.correctionDepth as LearnerSupportProfile["correctionDepth"],
    comparisonMode: value.comparisonMode as LearnerSupportProfile["comparisonMode"],
  };
}

function parseFeedbackCategory(value: unknown): FeedbackCategory | undefined {
  return typeof value === "string" && feedbackCategories.includes(value as FeedbackCategory)
    ? value as FeedbackCategory
    : undefined;
}

function parseDurableLearningEvent(value: unknown): DurableLearningEvent | undefined {
  if (!isRecord(value)) return undefined;

  const id = readString(value, "id");
  const type = readString(value, "type");
  const scenarioId = readString(value, "scenarioId");
  const occurredAt = readString(value, "occurredAt");
  if (!id || !type || !scenarioId || !occurredAt) return undefined;

  if (type === "scenario_completed") {
    return { id, type, scenarioId, occurredAt };
  }

  const conceptId = readString(value, "conceptId");
  if (!conceptId) return undefined;

  if (type === "feedback_observed") {
    const category = parseFeedbackCategory(value.category);
    const referenceIds = readStringArray(value.referenceIds);
    if (!category || !referenceIds) return undefined;

    return { id, type, scenarioId, category, conceptId, referenceIds, occurredAt };
  }

  if (type === "retry_completed") {
    const outcome = readString(value, "outcome");
    const evaluationEventId = readString(value, "evaluationEventId");
    if (!evaluationEventId || !["continued", "successful"].includes(outcome ?? "")) {
      return undefined;
    }

    return {
      id,
      type,
      scenarioId,
      conceptId,
      outcome: outcome as "continued" | "successful",
      evaluationEventId,
      occurredAt,
    };
  }

  if (type !== "turn_evaluated") return undefined;

  const destinationId = readString(value, "destinationId");
  const learnerStartingPoint = readString(value, "learnerStartingPoint");
  const evaluationCategory = parseFeedbackCategory(value.evaluationCategory);
  const targetDialectId = readString(value, "targetDialectId");
  const validationStatus = readString(value, "validationStatus");
  if (
    !destinationId ||
    !learnerStartingPoint ||
    !learnerStartingPointKinds.includes(
      learnerStartingPoint as (typeof learnerStartingPointKinds)[number],
    ) ||
    !evaluationCategory ||
    !targetDialectId ||
    (validationStatus !== "needs_review" && validationStatus !== "verified") ||
    typeof value.understood !== "boolean" ||
    typeof value.retryAttempted !== "boolean" ||
    typeof value.retrySuccess !== "boolean" ||
    (value.retrySuccess && !value.retryAttempted)
  ) {
    return undefined;
  }

  const likelySourceDialectId = readOptionalString(value, "likelySourceDialectId");
  const sourceDialectConfidence = readOptionalString(value, "sourceDialectConfidence");
  if (
    sourceDialectConfidence &&
    !sourceDialectConfidences.includes(sourceDialectConfidence as (typeof sourceDialectConfidences)[number])
  ) {
    return undefined;
  }
  const matchedVariantId = readOptionalString(value, "matchedVariantId");
  const suggestedAlternativeId = readOptionalString(value, "suggestedAlternativeId");

  return {
    id,
    type,
    destinationId,
    scenarioId,
    learnerStartingPoint:
      learnerStartingPoint as (typeof learnerStartingPointKinds)[number],
    conceptId,
    evaluationCategory,
    targetDialectId,
    ...(likelySourceDialectId ? { likelySourceDialectId } : {}),
    ...(sourceDialectConfidence
      ? { sourceDialectConfidence: sourceDialectConfidence as (typeof sourceDialectConfidences)[number] }
      : {}),
    ...(matchedVariantId ? { matchedVariantId } : {}),
    ...(suggestedAlternativeId ? { suggestedAlternativeId } : {}),
    understood: value.understood,
    retryAttempted: value.retryAttempted,
    retrySuccess: value.retrySuccess,
    validationStatus,
    occurredAt,
  };
}

export function parseLearnerProfile(value: unknown): LearnerProfile | undefined {
  if (!isRecord(value) || value.schemaVersion !== 2 || value.id !== "local-prototype") {
    return undefined;
  }
  if (!Array.isArray(value.knownConcepts) || !Array.isArray(value.learningEvents)) {
    return undefined;
  }

  const onboardingStatus = readString(value, "onboardingStatus");
  const startingPoint = parseStartingPoint(value.startingPoint);
  const support = parseSupport(value.support);
  const preferredLocale = value.preferredLocale;
  const updatedAt = readString(value, "updatedAt");
  if (
    (onboardingStatus !== "configured" && onboardingStatus !== "unconfigured") ||
    startingPoint === undefined ||
    !support ||
    (preferredLocale !== "ar" && preferredLocale !== "en") ||
    typeof value.persistOnDevice !== "boolean" ||
    !updatedAt ||
    (onboardingStatus === "configured" && startingPoint === null) ||
    (onboardingStatus === "unconfigured" && startingPoint !== null)
  ) {
    return undefined;
  }

  const knownConcepts = value.knownConcepts.map(parseKnownConcept);
  const learningEvents = value.learningEvents.map(parseDurableLearningEvent);
  if (knownConcepts.some((item) => !item) || learningEvents.some((item) => !item)) {
    return undefined;
  }

  const parsedKnownConcepts = knownConcepts as KnownConcept[];
  const parsedLearningEvents = learningEvents as DurableLearningEvent[];
  if (
    new Set(parsedKnownConcepts.map(({ conceptId }) => conceptId)).size !== parsedKnownConcepts.length ||
    new Set(parsedLearningEvents.map(({ id }) => id)).size !== parsedLearningEvents.length
  ) {
    return undefined;
  }

  return {
    schemaVersion: 2,
    id: "local-prototype",
    onboardingStatus,
    startingPoint,
    support,
    preferredLocale,
    knownConcepts: parsedKnownConcepts,
    learningEvents: parsedLearningEvents,
    persistOnDevice: value.persistOnDevice,
    updatedAt,
  };
}

function parseLegacyLearningEvent(value: unknown): DurableLearningEvent | undefined {
  if (!isRecord(value)) return undefined;
  const id = readString(value, "id");
  const type = readString(value, "type");
  const scenarioId = readString(value, "scenarioId");
  const occurredAt = readString(value, "occurredAt");
  if (!id || !type || !scenarioId || !occurredAt) return undefined;

  if (type === "scenario_completed") return { id, type, scenarioId, occurredAt };
  if (type !== "feedback_observed") return undefined;

  const conceptId = readString(value, "conceptId");
  const category = parseFeedbackCategory(value.category);
  const referenceIds = readStringArray(value.referenceIds);
  if (!conceptId || !category || !referenceIds) return undefined;

  return { id, type, scenarioId, conceptId, category, referenceIds, occurredAt };
}

export function migrateLegacyLearnerProfile(value: unknown): LearnerProfile | undefined {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    value.id !== "local-prototype" ||
    !Array.isArray(value.knownConcepts) ||
    !Array.isArray(value.learningEvents)
  ) {
    return undefined;
  }

  const preferredLocale = value.preferredLocale;
  const updatedAt = readString(value, "updatedAt");
  const knownConcepts = value.knownConcepts.map(parseKnownConcept);
  if (
    (preferredLocale !== "ar" && preferredLocale !== "en") ||
    !updatedAt ||
    knownConcepts.some((item) => !item)
  ) {
    return undefined;
  }

  const fallback = createMockLearnerProfile(updatedAt);
  return {
    ...fallback,
    preferredLocale,
    knownConcepts: knownConcepts as KnownConcept[],
    learningEvents: value.learningEvents
      .map(parseLegacyLearningEvent)
      .filter((event): event is DurableLearningEvent => Boolean(event)),
    persistOnDevice: value.persistOnDevice === true,
  };
}

function serializeKnownConcept(concept: KnownConcept): KnownConcept {
  return {
    conceptId: concept.conceptId,
    variantIds: [...new Set(concept.variantIds)],
    state: concept.state,
    ...(concept.lastEventAt ? { lastEventAt: concept.lastEventAt } : {}),
  };
}

function serializeDurableLearningEvent(event: DurableLearningEvent): DurableLearningEvent {
  if (event.type === "scenario_completed") {
    return {
      id: event.id,
      type: event.type,
      scenarioId: event.scenarioId,
      occurredAt: event.occurredAt,
    };
  }

  if (event.type === "feedback_observed") {
    return {
      id: event.id,
      type: event.type,
      scenarioId: event.scenarioId,
      category: event.category,
      conceptId: event.conceptId,
      referenceIds: [...event.referenceIds],
      occurredAt: event.occurredAt,
    };
  }

  if (event.type === "retry_completed") {
    return {
      id: event.id,
      type: event.type,
      scenarioId: event.scenarioId,
      conceptId: event.conceptId,
      outcome: event.outcome,
      evaluationEventId: event.evaluationEventId,
      occurredAt: event.occurredAt,
    };
  }

  return {
    id: event.id,
    type: event.type,
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

export function serializeLearnerProfile(profile: LearnerProfile) {
  const startingPoint = profile.startingPoint
    ? {
        kind: profile.startingPoint.kind,
        ...(profile.startingPoint.kind === "dialect_learner" &&
        profile.startingPoint.knownVarietyId
          ? { knownVarietyId: profile.startingPoint.knownVarietyId }
          : {}),
      }
    : null;

  return JSON.stringify({
    schemaVersion: 2,
    id: "local-prototype",
    onboardingStatus: profile.onboardingStatus,
    startingPoint,
    support: {
      translation: profile.support.translation,
      transliteration: profile.support.transliteration,
      phraseHints: profile.support.phraseHints,
      vocabularyPreview: profile.support.vocabularyPreview,
      expectedResponseComplexity: profile.support.expectedResponseComplexity,
      correctionDepth: profile.support.correctionDepth,
      comparisonMode: profile.support.comparisonMode,
    },
    preferredLocale: profile.preferredLocale,
    knownConcepts: profile.knownConcepts.map(serializeKnownConcept),
    learningEvents: profile.learningEvents.map(serializeDurableLearningEvent),
    persistOnDevice: profile.persistOnDevice,
    updatedAt: profile.updatedAt,
  });
}

function resolveBrowserStorage(): StorageLike | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function parseStoredValue(value: string | null) {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

export function createLearnerProfileRepository(
  storage: StorageLike | undefined = resolveBrowserStorage(),
): LearnerProfileRepository {
  return {
    async clear() {
      if (!storage) return false;
      try {
        storage.removeItem(learnerProfileStorageKey);
        storage.removeItem(legacyLearnerProfileStorageKey);
        return true;
      } catch {
        return false;
      }
    },
    async load() {
      if (!storage) return createMockLearnerProfile();

      try {
        const current = parseLearnerProfile(
          parseStoredValue(storage.getItem(learnerProfileStorageKey)),
        );
        if (current) return current;

        const migrated = migrateLegacyLearnerProfile(
          parseStoredValue(storage.getItem(legacyLearnerProfileStorageKey)),
        );
        if (!migrated) return createMockLearnerProfile();

        try {
          if (migrated.persistOnDevice) {
            storage.setItem(learnerProfileStorageKey, serializeLearnerProfile(migrated));
          }
          storage.removeItem(legacyLearnerProfileStorageKey);
        } catch {
          // Migration persistence is best-effort; the valid in-memory profile remains usable.
        }
        return migrated;
      } catch {
        return createMockLearnerProfile();
      }
    },
    async save(profile) {
      if (!storage) return false;

      try {
        if (!profile.persistOnDevice) {
          storage.removeItem(learnerProfileStorageKey);
          storage.removeItem(legacyLearnerProfileStorageKey);
          return true;
        }

        storage.setItem(learnerProfileStorageKey, serializeLearnerProfile(profile));
        storage.removeItem(legacyLearnerProfileStorageKey);
        return true;
      } catch {
        return false;
      }
    },
  };
}
