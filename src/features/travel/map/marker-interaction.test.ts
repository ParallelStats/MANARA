import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { selectDestinationSummaries } from "@/application/travel/select-destination-summaries";
import { selectWorldNetworkNodes } from "@/application/travel/select-world-network-nodes";
import { destinations } from "@/content/destinations";
import { futureDestinationNodes } from "@/content/travel-experiences";
import {
  projectFallbackWorldPoint,
  resolveNearestMarkerId,
  resolveNonOverlappingHitDiameters,
  shouldShowPersistentWorldLabel,
  type ScreenMarker,
} from "@/features/travel/map/marker-interaction";

const nodes = selectWorldNetworkNodes(
  selectDestinationSummaries(destinations),
  futureDestinationNodes,
);

function fallbackMarkers(width: number, height: number): readonly ScreenMarker[] {
  return nodes.map((node) => {
    const point = projectFallbackWorldPoint(node.coordinates);
    return { id: node.id, x: width * point.inline / 100, y: height * point.block / 100 };
  });
}

describe("world marker interaction", () => {
  it.each([
    ["Gulf", ["destination-abu-dhabi", "future-dubai", "future-sharjah", "future-doha"]],
    ["Levant", ["future-amman", "future-beirut", "future-damascus", "future-jerusalem"]],
    ["Egypt", ["destination-cairo", "future-alexandria", "future-aswan"]],
    ["Maghreb", ["destination-casablanca", "future-rabat", "future-marrakech", "future-fez"]],
  ])("selects the exact %s marker even when a different marker is first", (_region, ids) => {
    const markers = fallbackMarkers(390, 844);
    for (const id of ids) {
      const marker = markers.find((candidate) => candidate.id === id);
      expect(marker).toBeDefined();
      expect(resolveNearestMarkerId([...markers].reverse(), marker!)).toBe(id);
    }
  });

  it("keeps centered marker hit areas from overlapping their nearest neighbor", () => {
    const markers = fallbackMarkers(390, 844);
    const diameters = resolveNonOverlappingHitDiameters(markers);

    for (let firstIndex = 0; firstIndex < markers.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < markers.length; secondIndex += 1) {
        const first = markers[firstIndex]!;
        const second = markers[secondIndex]!;
        const distance = Math.hypot(first.x - second.x, first.y - second.y);
        const combinedRadii = ((diameters.get(first.id) ?? 0) + (diameters.get(second.id) ?? 0)) / 2;
        expect(combinedRadii).toBeLessThanOrEqual(distance);
      }
    }
  });

  it("prioritizes selected identity and keeps default mobile labels quiet", () => {
    expect(shouldShowPersistentWorldLabel("future-sharjah", "future-sharjah", 390)).toBe(true);
    expect(shouldShowPersistentWorldLabel("destination-cairo", undefined, 390)).toBe(false);
    expect(shouldShowPersistentWorldLabel("destination-cairo", undefined, 1440)).toBe(true);
    expect(shouldShowPersistentWorldLabel("destination-abu-dhabi", undefined, 1440)).toBe(true);
    expect(shouldShowPersistentWorldLabel("future-dubai", undefined, 1440)).toBe(false);
  });

  it("wires exact selection into both providers and exposes selected identity", () => {
    const fallback = readFileSync("src/features/travel/map/fallback-map-surface.tsx", "utf8");
    const geographicMap = readFileSync("src/features/travel/map/geographic-map.tsx", "utf8");
    const mapLibre = readFileSync("src/features/travel/map/maplibre-map-surface.tsx", "utf8");
    const world = readFileSync("src/features/travel/components/world-experience.tsx", "utf8");
    const styles = readFileSync("src/app/globals.css", "utf8");

    expect(fallback).toContain("resolveNearestMarkerId");
    expect(mapLibre).toContain('new maplibregl.Marker({ element: marker.button, anchor: "center" })');
    expect(mapLibre).toContain("resolveNonOverlappingHitDiameters");
    expect(mapLibre).toContain('marker.button.classList.add("world-map-node")');
    expect(styles).toContain(".world-map-node:hover .geo-node-label");
    expect(styles).toContain(".world-map-node:focus-visible .geo-node-label");
    expect(styles).toContain(".vector-geo-node.world-map-node:hover .vector-geo-node-copy");
    expect(geographicMap).toContain('data-map-level={props.level}');
    expect(styles).toContain('.map-provider-stack[data-map-level="city"] .maplibregl-ctrl-bottom-right');
    expect(styles).toMatch(/\.vector-geo-node-copy \{[\s\S]*?min-height: 2\.25rem;/);
    expect(styles).toMatch(/\.vector-geo-node-copy > span \{[\s\S]*?unicode-bidi: isolate;/);
    expect(world).toContain('aria-labelledby="selected-destination-title"');
    expect(world).toContain('id="selected-destination-title"');
  });

  it("limits expensive development diagnostics and reuses projected world points", () => {
    const mapLibre = readFileSync("src/features/travel/map/maplibre-map-surface.tsx", "utf8");

    expect(mapLibre).toContain("let diagnosticsCaptured = false");
    expect(mapLibre).toContain('if (process.env.NODE_ENV !== "development" || diagnosticsCaptured) return');
    expect(mapLibre).toContain("diagnosticsCaptured = true");
    expect(mapLibre).toContain("const projectedMarkers = markerRecords.map");
    expect(mapLibre).toContain('if (button.dataset.labelVisible !== labelVisible)');
  });

  it("preserves active, preview, and future city states in the interaction registry", () => {
    expect(nodes.find(({ id }) => id === "destination-cairo")?.availability).toBe("available");
    expect(nodes.find(({ id }) => id === "destination-abu-dhabi")?.availability).toBe("available");
    expect(nodes.find(({ id }) => id === "destination-casablanca")?.availability).toBe("preview");
    expect(nodes.find(({ id }) => id === "future-dubai")?.availability).toBe("future");
  });
});
