import { describe, expect, it } from "vitest";

import { destinations } from "@/content/destinations";
import {
  destinationArrivals,
  futureDestinationNodes,
  getDestinationHotspots,
  getScenarioHotspot,
  scenarioHotspots,
  worldCameraPreset,
} from "@/content/travel-experiences";
import type { AvailableScenarioHotspot, ScenarioHotspot } from "@/domain/travel/types";

describe("travel experience content", () => {
  it("has a camera arrival for every destination", () => {
    expect(destinationArrivals.map(({ destinationId }) => destinationId).sort()).toEqual(
      destinations.map(({ id }) => id).sort(),
    );

    for (const destination of destinations) {
      const arrival = destinationArrivals.find(({ destinationId }) => destinationId === destination.id);
      expect(arrival?.worldCamera.center).toEqual(destination.coordinates);
    }
  });

  it("keeps future destinations bilingual and non-enterable", () => {
    expect(futureDestinationNodes).toHaveLength(36);
    expect(futureDestinationNodes.map(({ name }) => name.en)).toEqual(expect.arrayContaining([
      "Dubai", "Riyadh", "Doha", "Amman", "Beirut", "Baghdad", "Alexandria",
      "Tunis", "Algiers", "Rabat", "Khartoum", "Sana'a",
    ]));
    expect(futureDestinationNodes.every(({ availability }) => availability === "future")).toBe(true);
    expect(futureDestinationNodes.every(({ validationStatus }) => validationStatus === "needs_review")).toBe(
      true,
    );
    expect(futureDestinationNodes.every((node) => !("dialect" in node))).toBe(true);
    expect(futureDestinationNodes.every((node) => !("scenarioId" in node))).toBe(true);
    expect(futureDestinationNodes.every((node) => !("scenarioIds" in node))).toBe(true);
    expect(
      futureDestinationNodes.every(({ countryName }) =>
        countryName.en.trim().length > 0 &&
        countryName.ar.trim().length > 0 &&
        countryName.ar === countryName.ar.normalize("NFC")),
    ).toBe(true);
    expect(futureDestinationNodes.every(({ labelPriority }) => labelPriority > 0)).toBe(true);
  });

  it("makes exactly the four curated learning hotspots enterable", () => {
    const hotspots: readonly ScenarioHotspot[] = scenarioHotspots;
    const available = hotspots.filter(
      (hotspot): hotspot is AvailableScenarioHotspot => hotspot.availability === "available",
    );

    expect(available.map(({ id, scenarioId }) => [id, scenarioId])).toEqual([
      ["hotspot-abu-dhabi-cafe", "scenario-abu-dhabi-cafe"],
      ["hotspot-abu-dhabi-campus", "scenario-abu-dhabi-campus"],
      ["hotspot-cairo-cafe", "scenario-cairo-cafe"],
      ["hotspot-cairo-transport", "scenario-cairo-transport"],
    ]);
    expect(
      scenarioHotspots
        .filter(({ availability }) => availability !== "available")
        .every((hotspot) => !("scenarioId" in hotspot)),
    ).toBe(true);
  });

  it("does not resolve preview, coming-soon, or Casablanca hotspots as scenarios", () => {
    expect(getScenarioHotspot("destination-abu-dhabi", "cafe")?.scenarioId).toBe(
      "scenario-abu-dhabi-cafe",
    );
    expect(getScenarioHotspot("destination-cairo", "cafe")?.scenarioId).toBe(
      "scenario-cairo-cafe",
    );
    expect(getScenarioHotspot("destination-abu-dhabi", "campus")?.scenarioId).toBe(
      "scenario-abu-dhabi-campus",
    );
    expect(getScenarioHotspot("destination-cairo", "transport")?.scenarioId).toBe(
      "scenario-cairo-transport",
    );
    expect(getScenarioHotspot("destination-abu-dhabi", "majlis")).toBeUndefined();
    expect(getScenarioHotspot("destination-abu-dhabi", "transport")).toBeUndefined();
    expect(getScenarioHotspot("destination-cairo", "market")).toBeUndefined();
    expect(getDestinationHotspots("destination-casablanca")).toEqual([]);
  });

  it("keeps arrival and hotspot copy bilingual with an explicit review state", () => {
    const records = [
      ...destinationArrivals.map((arrival) => ({
        copy: arrival.introduction,
        validationStatus: arrival.validationStatus,
      })),
      ...scenarioHotspots.map((hotspot) => ({
        copy: hotspot.objective,
        validationStatus: hotspot.validationStatus,
      })),
    ];

    for (const { copy, validationStatus } of records) {
      expect(copy.en.trim()).not.toBe("");
      expect(copy.ar.trim()).not.toBe("");
      expect(copy.ar).toBe(copy.ar.normalize("NFC"));
      expect(validationStatus).toBe("needs_review");
    }
  });

  it("uses valid geographic and camera values", () => {
    const points = [
      worldCameraPreset.center,
      ...destinations.map(({ coordinates }) => coordinates),
      ...destinationArrivals.flatMap(({ worldCamera, cityCamera }) => [
        worldCamera.center,
        cityCamera.center,
      ]),
      ...futureDestinationNodes.map(({ coordinates }) => coordinates),
      ...scenarioHotspots.map(({ coordinates }) => coordinates),
      ...scenarioHotspots.map(({ camera }) => camera.center),
    ];

    for (const [longitude, latitude] of points) {
      expect(longitude).toBeGreaterThanOrEqual(-180);
      expect(longitude).toBeLessThanOrEqual(180);
      expect(latitude).toBeGreaterThanOrEqual(-90);
      expect(latitude).toBeLessThanOrEqual(90);
    }

    expect(new Set(futureDestinationNodes.map(({ coordinates }) => coordinates.join(","))).size).toBe(
      futureDestinationNodes.length,
    );

    const cameras = [
      worldCameraPreset,
      ...destinationArrivals.flatMap(({ worldCamera, cityCamera }) => [worldCamera, cityCamera]),
      ...scenarioHotspots.map(({ camera }) => camera),
    ];

    for (const camera of cameras) {
      expect(camera.zoom).toBeGreaterThanOrEqual(0);
      expect(camera.zoom).toBeLessThanOrEqual(24);
      expect(camera.pitch).toBeGreaterThanOrEqual(0);
      expect(camera.pitch).toBeLessThanOrEqual(60);
      expect(camera.bearing).toBeGreaterThanOrEqual(-180);
      expect(camera.bearing).toBeLessThanOrEqual(180);
    }

    for (const { fallbackPosition } of scenarioHotspots) {
      expect(fallbackPosition.inline).toBeGreaterThanOrEqual(0);
      expect(fallbackPosition.inline).toBeLessThanOrEqual(100);
      expect(fallbackPosition.block).toBeGreaterThanOrEqual(0);
      expect(fallbackPosition.block).toBeLessThanOrEqual(100);
    }
  });
});
