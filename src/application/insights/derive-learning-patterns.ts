import type { LearningPattern } from "@/domain/insights/types";
import type { DurableLearningEvent, LearnerProfile, SourceDialectConfidence } from "@/domain/learning/types";

type TurnEvent = Extract<DurableLearningEvent, { type: "turn_evaluated" }>;

function patternKey(event: TurnEvent) {
  return `${event.conceptId}::${event.targetDialectId}`;
}

function unique(values: readonly string[]) {
  return [...new Set(values)];
}

function resolveSource(events: readonly TurnEvent[]): {
  likelySourceDialectId: string | null;
  sourceDialectConfidence: SourceDialectConfidence;
} {
  const trusted = events.filter(
    (event) =>
      event.validationStatus === "verified" &&
      event.sourceDialectConfidence === "HIGH" &&
      Boolean(event.likelySourceDialectId),
  );
  if (trusted.length < 2) {
    return { likelySourceDialectId: null, sourceDialectConfidence: "UNKNOWN" };
  }

  const sources = unique(trusted.flatMap((event) => event.likelySourceDialectId ?? []));
  return sources.length === 1
    ? { likelySourceDialectId: sources[0] ?? null, sourceDialectConfidence: "HIGH" }
    : { likelySourceDialectId: null, sourceDialectConfidence: "UNKNOWN" };
}

export function deriveLearningPatterns(profile: LearnerProfile): readonly LearningPattern[] {
  const turns = profile.learningEvents.filter(
    (event): event is TurnEvent => event.type === "turn_evaluated",
  );
  const groups = new Map<string, TurnEvent[]>();

  for (const event of turns) {
    const key = patternKey(event);
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, events]) => {
      const ordered = [...events].sort((a, b) =>
        a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id));
      const verified = ordered.filter(({ validationStatus }) => validationStatus === "verified");
      const retryEvents = profile.learningEvents.filter(
        (event) => event.type === "retry_completed" &&
          verified.some(({ id }) => id === event.evaluationEventId),
      );
      const successfulRetryTurns = verified.filter(({ retrySuccess }) => retrySuccess);
      const lastRetryAt = successfulRetryTurns.at(-1)?.occurredAt;
      const laterNaturalReuse = lastRetryAt
        ? verified.filter((event) =>
            event.occurredAt > lastRetryAt &&
            event.understood &&
            event.evaluationCategory === "natural_target_usage")
        : [];
      const categoryEventIds = Object.fromEntries(
        [...new Set(verified.map(({ evaluationCategory }) => evaluationCategory))]
          .sort()
          .map((category) => [
            category,
            verified.filter(({ evaluationCategory }) => evaluationCategory === category).map(({ id }) => id),
          ]),
      );

      return {
        key,
        conceptId: ordered[0]?.conceptId ?? "concept-unclassified",
        targetDialectId: ordered[0]?.targetDialectId ?? null,
        ...resolveSource(verified),
        eventIds: unique([
          ...verified.map(({ id }) => id),
          ...retryEvents.map(({ id }) => id),
        ]),
        scenarioIds: unique(verified.map(({ scenarioId }) => scenarioId)),
        categories: Object.keys(categoryEventIds),
        categoryEventIds,
        understoodCount: verified.filter(({ understood }) => understood).length,
        retrySuccessCount: successfulRetryTurns.length,
        laterNaturalReuseCount: laterNaturalReuse.length,
        verifiedEventCount: verified.length,
      } satisfies LearningPattern;
    });
}
