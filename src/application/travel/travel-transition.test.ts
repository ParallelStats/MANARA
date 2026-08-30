import { describe, expect, it } from "vitest";

import {
  initialTravelTransitionState,
  travelTransitionReducer,
} from "@/application/travel/travel-transition";

describe("travel transition reducer", () => {
  it("prevents a second travel operation while one is active", () => {
    const started = travelTransitionReducer(initialTravelTransitionState, {
      type: "start",
      targetId: "destination-cairo",
    });

    expect(
      travelTransitionReducer(started, { type: "start", targetId: "destination-abu-dhabi" }),
    ).toBe(started);
  });

  it("ignores stale completion and failure events", () => {
    const started = travelTransitionReducer(initialTravelTransitionState, {
      type: "start",
      targetId: "destination-cairo",
    });

    expect(travelTransitionReducer(started, { type: "complete", operationId: 99 })).toBe(started);
    expect(travelTransitionReducer(started, { type: "fail", operationId: 99, message: "late" })).toBe(started);
  });

  it("settles skip and cancellation synchronously", () => {
    const started = travelTransitionReducer(initialTravelTransitionState, {
      type: "start",
      targetId: "destination-cairo",
    });

    expect(travelTransitionReducer(started, { type: "skip", operationId: 1 }).phase).toBe("idle");
    expect(travelTransitionReducer(started, { type: "cancel" })).toEqual({
      phase: "idle",
      operationId: 2,
    });
  });
});
