import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { OPENFREEMAP_STYLE_URL, resolveMapConfiguration } from "@/config/map";

describe("MapLibre configuration", () => {
  it("uses the keyless OpenFreeMap Liberty style", () => {
    expect(resolveMapConfiguration()).toEqual({
      provider: "maplibre",
      styleUrl: OPENFREEMAP_STYLE_URL,
    });
    expect(OPENFREEMAP_STYLE_URL).toBe("https://tiles.openfreemap.org/styles/liberty");
  });

  it("has no Mapbox token gate or browser token exposure", () => {
    const renderer = readFileSync("src/features/travel/map/maplibre-map-surface.tsx", "utf8");
    const composition = readFileSync("src/features/travel/map/geographic-map.tsx", "utf8");
    const environmentExample = readFileSync(".env.example", "utf8");

    expect(`${renderer}${composition}${environmentExample}`).not.toMatch(/NEXT_PUBLIC_MAPBOX|accessToken|mapbox-gl/i);
    expect(renderer).toContain("styleUrl");
  });

  it("keeps the provider-loading and provider-error fallback paths", () => {
    const composition = readFileSync("src/features/travel/map/geographic-map.tsx", "utf8");

    expect(composition).toContain('reason="provider_loading"');
    expect(composition).toContain('reason="provider_error"');
    expect(composition).toContain("FallbackMapSurface");
  });

  it("waits for real tiles and uses a readable MANARA regional palette", () => {
    const renderer = readFileSync("src/features/travel/map/maplibre-map-surface.tsx", "utf8");

    expect(renderer).toContain('map.setProjection({ type: "mercator" })');
    expect(renderer).toContain("applyManaraMapPalette(map, level)");
    expect(renderer).toContain('event.sourceId === "openmaptiles"');
    expect(renderer).toMatch(/map\.querySourceFeatures\(\s*"openmaptiles"/);
    expect(renderer).toContain("hasRenderableMapBase");
    expect(renderer).toContain('sourceLayer === "boundary"');
    expect(renderer).toContain('sourceLayer === "place" && !isCountryLabel');
    expect(renderer).toContain("markProviderReady");
  });
});
