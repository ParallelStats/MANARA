import {
  getDestinationArrival,
  worldCameraPreset,
} from "@/content/travel-experiences";
import type {
  ScenarioHotspot,
  TravelRoute,
  TravelTransferContext,
} from "@/domain/travel/types";

interface WorldTravelRouteInput {
  readonly operationId: number;
  readonly targetDestinationId: string;
  readonly targetDialectId: string;
  readonly originDestinationId?: string;
  readonly transferContext?: TravelTransferContext;
}

export function createWorldTravelRoute({
  operationId,
  targetDestinationId,
  targetDialectId,
  originDestinationId,
  transferContext,
}: WorldTravelRouteInput): TravelRoute | undefined {
  const targetArrival = getDestinationArrival(targetDestinationId);
  if (!targetArrival) return undefined;

  const originArrival = originDestinationId
    ? getDestinationArrival(originDestinationId)
    : undefined;

  return {
    id: `world-${operationId}-${targetDestinationId}`,
    from: originArrival?.worldCamera ?? worldCameraPreset,
    to: targetArrival.cityCamera,
    ...(originDestinationId ? { originDestinationId } : {}),
    targetDestinationId,
    durationMs: 4200,
    reducedMotionDurationMs: 420,
    transferContext:
      transferContext?.targetDialectId === targetDialectId
        ? transferContext
        : { targetDialectId, conceptIds: [] },
  };
}

export function createScenarioTravelRoute(
  operationId: number,
  hotspot: ScenarioHotspot,
  targetDialectId: string,
): TravelRoute | undefined {
  const arrival = getDestinationArrival(hotspot.destinationId);
  if (!arrival || hotspot.availability !== "available") return undefined;

  return {
    id: `scenario-${operationId}-${hotspot.id}`,
    from: arrival.cityCamera,
    to: hotspot.camera,
    originDestinationId: hotspot.destinationId,
    targetDestinationId: hotspot.destinationId,
    durationMs: 2200,
    reducedMotionDurationMs: 320,
    transferContext: {
      targetDialectId,
      conceptIds: [],
    },
  };
}
