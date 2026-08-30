import { describe, expect, it } from "vitest";

import {
  createScenarioSessionState,
  reduceScenarioSession,
  type ScenarioSessionState,
} from "@/application/scenario/session-state";

describe("scenario session reducer", () => {
  it("runs the deterministic input and character-response cycle", () => {
    let state = createScenarioSessionState("session-1", "scenario-1", "beat-1");
    state = reduceScenarioSession(state, { type: "prepare", sessionId: "session-1" });
    state = reduceScenarioSession(state, { type: "ready", sessionId: "session-1" });
    state = reduceScenarioSession(state, { type: "begin_input", sessionId: "session-1", turnId: "turn-1" });
    state = reduceScenarioSession(state, { type: "submit_input", sessionId: "session-1", turnId: "turn-1" });
    state = reduceScenarioSession(state, { type: "character_response", sessionId: "session-1", turnId: "turn-1", nextBeatId: "beat-2" });
    state = reduceScenarioSession(state, { type: "continue", sessionId: "session-1", turnId: "turn-1" });
    expect(state.phase).toBe("ready");
    expect(state.currentBeatId).toBe("beat-2");
    expect(state.completedBeatIds).toEqual(["beat-1"]);
  });

  it("ignores stale session and turn responses", () => {
    const state = { ...createScenarioSessionState("session-1", "scenario-1", "beat-1"), phase: "processing" as const, activeTurnId: "turn-2" };
    expect(reduceScenarioSession(state, { type: "character_response", sessionId: "session-old", turnId: "turn-2" })).toBe(state);
    expect(reduceScenarioSession(state, { type: "character_response", sessionId: "session-1", turnId: "turn-old" })).toBe(state);
  });

  it("permits at most one retry for the same turn", () => {
    const offered = {
      ...createScenarioSessionState("session-1", "scenario-1", "beat-1"),
      phase: "feedback_offered" as const,
      activeTurnId: "turn-1",
    };
    const retrying = reduceScenarioSession(offered, { type: "begin_retry", sessionId: "session-1", turnId: "turn-1" });
    const responded = reduceScenarioSession(retrying, { type: "retry_resolved", sessionId: "session-1", turnId: "turn-1" });
    const offeredAgain = { ...responded, phase: "feedback_offered" as const };
    expect(reduceScenarioSession(offeredAgain, { type: "begin_retry", sessionId: "session-1", turnId: "turn-1" })).toBe(offeredAgain);
  });

  it("moves through a distinct completion state", () => {
    let state: ScenarioSessionState = {
      ...createScenarioSessionState("session-1", "scenario-1", "beat-6"),
      phase: "character_responding" as const,
      activeTurnId: "turn-6",
      pendingCompletion: true,
    };
    state = reduceScenarioSession(state, { type: "continue", sessionId: "session-1", turnId: "turn-6" });
    expect(state.phase).toBe("completing");
    state = reduceScenarioSession(state, { type: "complete", sessionId: "session-1" });
    expect(state.phase).toBe("completed");
  });

  it("recovers from a scoped error and ignores later work after cancellation", () => {
    let state: ScenarioSessionState = { ...createScenarioSessionState("session-1", "scenario-1", "beat-1"), phase: "ready" };
    state = reduceScenarioSession(state, { type: "fail", sessionId: "session-1", errorCode: "mock_failure" });
    expect(state.phase).toBe("recoverable_error");
    state = reduceScenarioSession(state, { type: "recover", sessionId: "session-1" });
    expect(state.phase).toBe("ready");
    state = reduceScenarioSession(state, { type: "cancel", sessionId: "session-1" });
    expect(reduceScenarioSession(state, { type: "begin_input", sessionId: "session-1", turnId: "turn-1" })).toBe(state);
  });
});
