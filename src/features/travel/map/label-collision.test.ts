import { describe, expect, it } from "vitest";

import { resolveMapLabelPlacements } from "@/features/travel/map/label-collision";

describe("map label collision", () => {
  it("keeps markers independent while hiding colliding lower-priority labels", () => {
    const placements = resolveMapLabelPlacements(
      [
        { id: "cairo", x: 180, y: 130, labelLength: 5, priority: 900, selected: false },
        { id: "alexandria", x: 184, y: 132, labelLength: 10, priority: 500, selected: false },
      ],
      { width: 390, height: 440, maxLabels: 1 },
    );

    expect(placements.find(({ id }) => id === "cairo")?.visible).toBe(true);
    expect(placements.find(({ id }) => id === "alexandria")?.visible).toBe(false);
    expect(placements).toHaveLength(2);
  });

  it("gives a selected marker first placement regardless of base priority", () => {
    const placements = resolveMapLabelPlacements(
      [
        { id: "abu-dhabi", x: 210, y: 180, labelLength: 9, priority: 950, selected: false },
        { id: "sharjah", x: 212, y: 181, labelLength: 7, priority: 300, selected: true },
      ],
      { width: 390, height: 440, maxLabels: 1 },
    );

    expect(placements.find(({ id }) => id === "sharjah")?.visible).toBe(true);
    expect(placements.find(({ id }) => id === "abu-dhabi")?.visible).toBe(false);
  });

  it("limits mobile label density without removing any placement records", () => {
    const candidates = Array.from({ length: 12 }, (_, index) => ({
      id: `node-${index}`,
      x: 24 + index * 28,
      y: 180 + (index % 2) * 70,
      labelLength: 7,
      priority: 500 - index,
      selected: false,
    }));
    const placements = resolveMapLabelPlacements(candidates, {
      width: 390,
      height: 500,
      maxLabels: 5,
    });

    expect(placements).toHaveLength(candidates.length);
    expect(placements.filter(({ visible }) => visible).length).toBeLessThanOrEqual(5);
  });

  it("keeps the selected Abu Dhabi label visible and anchored inside the Gulf edge", () => {
    const [placement] = resolveMapLabelPlacements(
      [{ id: "abu-dhabi", x: 360, y: 190, labelLength: 18, priority: 950, selected: true }],
      { width: 390, height: 440, maxLabels: 0, insets: { top: 90, right: 20, bottom: 34, left: 20 } },
    );

    expect(placement).toEqual({ id: "abu-dhabi", anchor: "left", visible: true });
  });
});
