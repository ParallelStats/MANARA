import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { selectDestinationSummaries } from "@/application/travel/select-destination-summaries";
import {
  getWorldNodePresentationPriority,
  isEnterableWorldNetworkNode,
  selectWorldNetworkNodes,
} from "@/application/travel/select-world-network-nodes";
import { destinations } from "@/content/destinations";
import { futureDestinationNodes } from "@/content/travel-experiences";

const worldNodes = selectWorldNetworkNodes(
  selectDestinationSummaries(destinations),
  futureDestinationNodes,
);

describe("world network registry", () => {
  it("builds one data-driven registry containing every visible city", () => {
    expect(worldNodes).toHaveLength(39);
    expect(new Set(worldNodes.map(({ id }) => id)).size).toBe(worldNodes.length);
    expect(worldNodes.map(({ id }) => id)).toEqual([
      ...destinations.map(({ id }) => id),
      ...futureDestinationNodes.map(({ id }) => id),
    ]);
  });

  it("keeps Abu Dhabi and Cairo active, Casablanca preview, and all other nodes future", () => {
    expect(worldNodes.filter(isEnterableWorldNetworkNode).map(({ name }) => name.en)).toEqual([
      "Cairo",
      "Abu Dhabi",
    ]);
    expect(worldNodes.find(({ id }) => id === "destination-casablanca")?.availability).toBe("preview");
    expect(worldNodes.filter(({ availability }) => availability === "future")).toHaveLength(36);
  });

  it("propagates localized country names through active and future node branches", () => {
    expect(worldNodes.find(({ id }) => id === "destination-cairo")?.countryName).toEqual({
      en: "Egypt",
      ar: "مصر",
    });
    expect(worldNodes.find(({ id }) => id === "future-riyadh")?.countryName).toEqual({
      en: "Saudi Arabia",
      ar: "المملكة العربية السعودية",
    });
  });

  it("never adds route or dialect fields to future network nodes", () => {
    const futureNodes = worldNodes.filter(({ source }) => source === "future");
    expect(futureNodes.every((node) => !("slug" in node))).toBe(true);
    expect(futureNodes.every((node) => !("dialect" in node))).toBe(true);
    expect(futureNodes.every((node) => !("scenarioIds" in node))).toBe(true);
  });

  it("always gives the selected node the highest label priority", () => {
    const selected = worldNodes.find(({ id }) => id === "future-sharjah");
    expect(selected).toBeDefined();
    const selectedPriority = getWorldNodePresentationPriority(selected!, selected!.id);
    expect(selectedPriority).toBeGreaterThan(
      Math.max(...worldNodes.filter(({ id }) => id !== selected!.id).map((node) => getWorldNodePresentationPriority(node))),
    );
  });

  it("keeps MapLibre and fallback wired to the shared worldNodes contract", () => {
    const mapLibreSource = readFileSync("src/features/travel/map/maplibre-map-surface.tsx", "utf8");
    const fallbackSource = readFileSync("src/features/travel/map/fallback-map-surface.tsx", "utf8");
    expect(mapLibreSource).toContain("worldNodes");
    expect(fallbackSource).toContain("worldNodes");
    expect(mapLibreSource).not.toContain("futureDestinations");
    expect(fallbackSource).not.toContain("futureDestinations");
  });
});
