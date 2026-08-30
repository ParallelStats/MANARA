import { describe, expect, it } from "vitest";

import {
  createScenarioTravelRoute,
  createWorldTravelRoute,
} from "@/application/travel/create-travel-route";
import { scenarioHotspots, worldCameraPreset } from "@/content/travel-experiences";

describe("travel route planning", () => {
  it("builds a four-second world-to-city route with an empty transfer context", () => {
    const route = createWorldTravelRoute({
      operationId: 4,
      targetDestinationId: "destination-abu-dhabi",
      targetDialectId: "emirati-abu-dhabi",
    });

    expect(route).toMatchObject({
      id: "world-4-destination-abu-dhabi",
      from: worldCameraPreset,
      durationMs: 4200,
      reducedMotionDurationMs: 420,
      transferContext: {
        targetDialectId: "emirati-abu-dhabi",
        conceptIds: [],
      },
    });
  });

  it("preserves an application-selected learning transfer context", () => {
    const route = createWorldTravelRoute({
      operationId: 5,
      originDestinationId: "destination-cairo",
      transferContext: {
        sourceDialectId: "egyptian-cairo",
        targetDialectId: "emirati-abu-dhabi",
        conceptIds: ["concept-order-coffee"],
      },
      targetDestinationId: "destination-abu-dhabi",
      targetDialectId: "emirati-abu-dhabi",
    });

    expect(route?.transferContext).toEqual({
      sourceDialectId: "egyptian-cairo",
      targetDialectId: "emirati-abu-dhabi",
      conceptIds: ["concept-order-coffee"],
    });
  });

  it("only creates scenario travel for an available hotspot", () => {
    const cafe = scenarioHotspots.find(({ id }) => id === "hotspot-abu-dhabi-cafe");
    const preview = scenarioHotspots.find(({ id }) => id === "hotspot-abu-dhabi-majlis");

    expect(cafe && createScenarioTravelRoute(1, cafe, "emirati-abu-dhabi")?.durationMs).toBe(2200);
    expect(preview && createScenarioTravelRoute(2, preview, "emirati-abu-dhabi")).toBeUndefined();
  });
});
