import type { LearnerProfile } from "@/domain/learning/types";
import type { TravelTransferContext } from "@/domain/travel/types";

export function selectTravelTransferContext(
  profile: LearnerProfile,
  targetDialectId: string,
): TravelTransferContext {
  const conceptIds = profile.knownConcepts
    .filter(({ state }) => state === "practised" || state === "used")
    .map(({ conceptId }) => conceptId);
  const eligibleEvents = profile.learningEvents
    .filter(
      (event) =>
        event.type === "turn_evaluated" &&
        event.understood &&
        event.validationStatus === "verified",
    )
    .toSorted((first, second) => second.occurredAt.localeCompare(first.occurredAt));

  for (const event of eligibleEvents) {
    if (event.type !== "turn_evaluated") continue;
    if (!conceptIds.includes(event.conceptId)) conceptIds.push(event.conceptId);
  }

  const declaredSource = profile.startingPoint?.kind === "dialect_learner"
    ? profile.startingPoint.knownVarietyId
    : undefined;
  const historicalSource = eligibleEvents.find((event) => {
    if (event.type !== "turn_evaluated") return false;
    const sourceDialectId = event.likelySourceDialectId ?? event.targetDialectId;
    return sourceDialectId !== targetDialectId;
  });
  const historicalSourceDialectId = historicalSource?.type === "turn_evaluated"
    ? historicalSource.likelySourceDialectId ?? historicalSource.targetDialectId
    : undefined;
  const sourceDialectId = declaredSource && declaredSource !== targetDialectId
    ? declaredSource
    : historicalSourceDialectId;

  return {
    ...(sourceDialectId ? { sourceDialectId } : {}),
    targetDialectId,
    conceptIds: [...new Set(conceptIds)],
  };
}
