import type { GeographicPoint } from "@/domain/travel/types";

export interface GeographicArc {
  readonly type: "Feature";
  readonly properties: Readonly<{ routeId: string }>;
  readonly geometry: Readonly<{
    type: "LineString";
    coordinates: readonly GeographicPoint[];
  }>;
}

export function createGeographicArc(
  routeId: string,
  origin: GeographicPoint | undefined,
  destination: GeographicPoint,
  segments = 48,
): GeographicArc | undefined {
  if (!origin || (origin[0] === destination[0] && origin[1] === destination[1])) {
    return undefined;
  }

  const midpoint: GeographicPoint = [
    (origin[0] + destination[0]) / 2,
    (origin[1] + destination[1]) / 2 + Math.min(14, Math.max(7, Math.abs(destination[0] - origin[0]) * 0.22)),
  ];
  const coordinates: GeographicPoint[] = [];

  for (let index = 0; index <= segments; index += 1) {
    const progress = index / segments;
    const inverse = 1 - progress;
    coordinates.push([
      inverse * inverse * origin[0] + 2 * inverse * progress * midpoint[0] + progress * progress * destination[0],
      inverse * inverse * origin[1] + 2 * inverse * progress * midpoint[1] + progress * progress * destination[1],
    ]);
  }

  return {
    type: "Feature",
    properties: { routeId },
    geometry: { type: "LineString", coordinates },
  };
}
