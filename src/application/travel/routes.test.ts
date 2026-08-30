import { describe, expect, it } from "vitest";

import { cityRoute, scenarioRoute, worldRoute } from "@/application/travel/routes";

describe("travel routes", () => {
  it("keeps the journey hierarchy visible in stable URLs", () => {
    expect(worldRoute()).toBe("/map");
    expect(cityRoute("abu-dhabi")).toBe("/map/abu-dhabi");
    expect(scenarioRoute("abu-dhabi", "cafe")).toBe("/map/abu-dhabi/cafe");
  });
});
