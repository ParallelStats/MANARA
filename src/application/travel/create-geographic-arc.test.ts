import { describe, expect, it } from "vitest";

import { createGeographicArc } from "@/application/travel/create-geographic-arc";

describe("geographic route arc", () => {
  it("creates a restrained curved route between different cities", () => {
    const arc = createGeographicArc("cairo-to-abu-dhabi", [31.2357, 30.0444], [54.3773, 24.4539]);

    expect(arc?.geometry.coordinates).toHaveLength(49);
    expect(arc?.geometry.coordinates[0]).toEqual([31.2357, 30.0444]);
    expect(arc?.geometry.coordinates.at(-1)).toEqual([54.3773, 24.4539]);
    expect(arc?.geometry.coordinates[24]?.[1]).toBeGreaterThan(30);
  });

  it("omits routes without a distinct previous destination", () => {
    expect(createGeographicArc("first", undefined, [54.3773, 24.4539])).toBeUndefined();
    expect(createGeographicArc("same", [31.2357, 30.0444], [31.2357, 30.0444])).toBeUndefined();
  });
});
