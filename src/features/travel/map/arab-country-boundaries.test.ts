import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const geoJson = JSON.parse(
  readFileSync("public/data/arab-country-boundaries.geojson", "utf8"),
) as {
  readonly features: readonly {
    readonly properties: { readonly code: string };
    readonly geometry: {
      readonly type: "Polygon" | "MultiPolygon";
      readonly coordinates: unknown;
    };
  }[];
  readonly source: string;
};

describe("Arab-world country highlighting", () => {
  it("includes all 22 Arab League member-state boundary records", () => {
    const codes = new Set(geoJson.features.map(({ properties }) => properties.code));
    expect(codes.size).toBe(22);
    expect([...codes]).toEqual(expect.arrayContaining(["ARE", "EGY", "MAR", "PSX"]));
    expect(geoJson.source).toContain("Natural Earth");
  });

  it("contains projected geographic polygon coordinates rather than decorative shapes", () => {
    for (const feature of geoJson.features) {
      expect(["Polygon", "MultiPolygon"]).toContain(feature.geometry.type);
      expect(JSON.stringify(feature.geometry.coordinates).length).toBeGreaterThan(20);
    }
  });

  it("wires the same local data into rich and fallback map renderers", () => {
    const mapLibre = readFileSync("src/features/travel/map/maplibre-map-surface.tsx", "utf8");
    const fallback = readFileSync("src/app/globals.css", "utf8");
    const orderedLayers = mapLibre.slice(
      mapLibre.indexOf("const orderedIds = ["),
      mapLibre.indexOf("];", mapLibre.indexOf("const orderedIds = [")),
    );
    expect(mapLibre).toContain('data: "/data/arab-country-boundaries.geojson"');
    expect(mapLibre).toContain("map.moveLayer(id)");
    expect(orderedLayers.indexOf("arabCountryLayerIds.fill")).toBeLessThan(
      orderedLayers.indexOf("arabCountryLayerIds.border"),
    );
    expect(fallback).toContain('url("/data/arab-country-boundaries.svg")');
  });
});
