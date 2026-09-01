import { describe, expect, it } from "vitest";

import { HotspotLandmarkIcon } from "@/features/travel/map/hotspot-landmark";

describe("city hotspot landmarks", () => {
  it.each(["cafe", "campus", "majlis", "market", "transport"] as const)(
    "provides a compact %s landmark",
    (kind) => {
      const icon = HotspotLandmarkIcon({ kind });
      expect(icon.props.viewBox).toBe("0 0 24 24");
      expect(icon.props.children.length).toBeGreaterThan(1);
    },
  );
});
