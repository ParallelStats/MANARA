import { describe, expect, it } from "vitest";

import { createConversationOperationGate } from "@/application/conversation/conversation-operation";

describe("conversation operation gate", () => {
  it("prevents duplicate learner turns and rapid microphone submissions", () => {
    const gate = createConversationOperationGate();
    expect(gate.start()).not.toBeNull();
    expect(gate.start()).toBeNull();
  });

  it("ignores a stale reply after an operation finishes", () => {
    const gate = createConversationOperationGate();
    const first = gate.start()!;
    gate.finish(first.id);
    const second = gate.start()!;
    expect(gate.isCurrent(first.id)).toBe(false);
    expect(gate.isCurrent(second.id)).toBe(true);
  });

  it("aborts active provider work during navigation cleanup", () => {
    const gate = createConversationOperationGate();
    const active = gate.start()!;
    gate.cancel();
    expect(active.signal.aborted).toBe(true);
    expect(gate.isCurrent(active.id)).toBe(false);
  });
});
