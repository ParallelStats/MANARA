import { describe, expect, it } from "vitest";

import { hasRenderableMapBase } from "@/features/travel/map/map-readiness";

describe("map provider readiness", () => {
  it("reveals a city style once its vector source is configured", () => {
    expect(hasRenderableMapBase("city", {
      styleLoaded: false,
      hasRasterSource: true,
      hasVectorSource: true,
    })).toBe(false);
    expect(hasRenderableMapBase("city", {
      styleLoaded: true,
      hasRasterSource: true,
      hasVectorSource: true,
    })).toBe(true);
  });

  it("allows the world renderer to use its geographic raster base", () => {
    expect(hasRenderableMapBase("world", {
      styleLoaded: true,
      hasRasterSource: true,
      hasVectorSource: false,
    })).toBe(true);
  });

  it("rejects a loaded style with no geographic source", () => {
    expect(hasRenderableMapBase("city", {
      styleLoaded: true,
      hasRasterSource: false,
      hasVectorSource: false,
    })).toBe(false);
  });
});
