import type { GeographicPoint } from "@/domain/travel/types";

export interface ScreenMarker {
  readonly id: string;
  readonly x: number;
  readonly y: number;
}

export interface ScreenPoint {
  readonly x: number;
  readonly y: number;
}

const preferredHitDiameter = 32;
const minimumHitDiameter = 0.5;
const hitAreaGap = 2;

export function projectFallbackWorldPoint([longitude, latitude]: GeographicPoint) {
  return {
    inline: Math.max(5, Math.min(95, ((longitude + 15) / 80) * 100)),
    block: Math.max(17, Math.min(67, 22 + ((39 - latitude) / 29) * 42)),
  };
}

function distanceBetween(first: ScreenPoint, second: ScreenPoint) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

export function resolveNearestMarkerId(
  markers: readonly ScreenMarker[],
  point: ScreenPoint,
  maximumDistance = 22,
) {
  let nearest: ScreenMarker | undefined;
  let nearestDistance = maximumDistance;

  for (const marker of markers) {
    const distance = distanceBetween(marker, point);
    if (distance >= nearestDistance) continue;
    nearest = marker;
    nearestDistance = distance;
  }

  return nearest?.id;
}

export function resolveNonOverlappingHitDiameters(
  markers: readonly ScreenMarker[],
  maximumDiameter = preferredHitDiameter,
) {
  return new Map(markers.map((marker) => {
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const candidate of markers) {
      if (candidate.id === marker.id) continue;
      nearestDistance = Math.min(nearestDistance, distanceBetween(marker, candidate));
    }

    const diameter = Number.isFinite(nearestDistance)
      ? Math.max(minimumHitDiameter, Math.min(maximumDiameter, nearestDistance - hitAreaGap))
      : maximumDiameter;

    return [marker.id, diameter] as const;
  }));
}

export function shouldShowPersistentWorldLabel(
  markerId: string,
  selectedMarkerId: string | undefined,
  viewportWidth: number,
) {
  if (markerId === selectedMarkerId) return true;
  if (viewportWidth < 640) return false;
  return markerId === "destination-abu-dhabi" || markerId === "destination-cairo";
}
