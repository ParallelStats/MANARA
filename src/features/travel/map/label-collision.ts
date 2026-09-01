export type MapLabelAnchor = "bottom" | "left" | "right" | "top";

export interface MapLabelCandidate {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly labelLength: number;
  readonly priority: number;
  readonly selected: boolean;
}

export interface MapLabelPlacement {
  readonly id: string;
  readonly anchor: MapLabelAnchor;
  readonly visible: boolean;
}

interface CollisionArea {
  readonly width: number;
  readonly height: number;
  readonly maxLabels: number;
  readonly insets?: Readonly<{
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  }>;
}

interface Box {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

const anchors: readonly MapLabelAnchor[] = ["top", "right", "bottom", "left"];

function preferredAnchors(candidate: MapLabelCandidate, width: number, height: number) {
  if (candidate.x < width * 0.24) return ["right", "bottom", "top", "left"] as const;
  if (candidate.x > width * 0.76) return ["left", "bottom", "top", "right"] as const;
  if (candidate.y < height * 0.22) return ["bottom", "right", "left", "top"] as const;
  if (candidate.y > height * 0.78) return ["top", "right", "left", "bottom"] as const;
  return anchors;
}

function labelBox(candidate: MapLabelCandidate, anchor: MapLabelAnchor): Box {
  const width = Math.min(176, Math.max(72, 42 + candidate.labelLength * 5));
  const height = candidate.selected ? 43 : 38;
  const gap = candidate.selected ? 19 : 17;

  switch (anchor) {
    case "bottom":
      return {
        left: candidate.x - width / 2,
        top: candidate.y + gap,
        right: candidate.x + width / 2,
        bottom: candidate.y + gap + height,
      };
    case "left":
      return {
        left: candidate.x - gap - width,
        top: candidate.y - height / 2,
        right: candidate.x - gap,
        bottom: candidate.y + height / 2,
      };
    case "right":
      return {
        left: candidate.x + gap,
        top: candidate.y - height / 2,
        right: candidate.x + gap + width,
        bottom: candidate.y + height / 2,
      };
    case "top":
      return {
        left: candidate.x - width / 2,
        top: candidate.y - gap - height,
        right: candidate.x + width / 2,
        bottom: candidate.y - gap,
      };
  }
}

function overlaps(first: Box, second: Box) {
  const breathingRoom = 5;
  return !(
    first.right + breathingRoom <= second.left ||
    first.left >= second.right + breathingRoom ||
    first.bottom + breathingRoom <= second.top ||
    first.top >= second.bottom + breathingRoom
  );
}

function fits(box: Box, area: CollisionArea) {
  const top = area.insets?.top ?? 12;
  const right = area.width - (area.insets?.right ?? 12);
  const bottom = area.height - (area.insets?.bottom ?? 12);
  const left = area.insets?.left ?? 12;

  return box.left >= left && box.right <= right && box.top >= top && box.bottom <= bottom;
}

function overflowAmount(box: Box, area: CollisionArea) {
  const top = area.insets?.top ?? 12;
  const right = area.width - (area.insets?.right ?? 12);
  const bottom = area.height - (area.insets?.bottom ?? 12);
  const left = area.insets?.left ?? 12;
  return Math.max(0, left - box.left) + Math.max(0, box.right - right)
    + Math.max(0, top - box.top) + Math.max(0, box.bottom - bottom);
}

export function resolveMapLabelPlacements(
  candidates: readonly MapLabelCandidate[],
  area: CollisionArea,
): readonly MapLabelPlacement[] {
  const accepted: Box[] = [];
  const placements = new Map<string, MapLabelPlacement>();
  let visibleCount = 0;

  const ordered = [...candidates].sort(
    (first, second) =>
      Number(second.selected) - Number(first.selected) ||
      second.priority - first.priority ||
      first.id.localeCompare(second.id),
  );

  for (const candidate of ordered) {
    if (!candidate.selected && visibleCount >= area.maxLabels) {
      placements.set(candidate.id, { id: candidate.id, anchor: "top", visible: false });
      continue;
    }

    let placement: MapLabelPlacement | undefined;
    const candidateAnchors = preferredAnchors(candidate, area.width, area.height);
    for (const anchor of candidateAnchors) {
      const box = labelBox(candidate, anchor);
      if (!fits(box, area) || accepted.some((acceptedBox) => overlaps(box, acceptedBox))) continue;

      accepted.push(box);
      visibleCount += 1;
      placement = { id: candidate.id, anchor, visible: true };
      break;
    }

    if (!placement && candidate.selected) {
      const anchor = [...candidateAnchors].sort(
        (first, second) => overflowAmount(labelBox(candidate, first), area)
          - overflowAmount(labelBox(candidate, second), area),
      )[0] ?? "top";
      accepted.push(labelBox(candidate, anchor));
      visibleCount += 1;
      placement = { id: candidate.id, anchor, visible: true };
    }

    placements.set(candidate.id, placement ?? { id: candidate.id, anchor: "top", visible: false });
  }

  return candidates.map(
    ({ id }) => placements.get(id) ?? { id, anchor: "top" as const, visible: false },
  );
}
