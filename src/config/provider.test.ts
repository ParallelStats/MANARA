import { describe, expect, it } from "vitest";

import {
  providerConfiguration,
  resolveProviderConfiguration,
} from "@/config/provider";

describe("provider configuration", () => {
  it("defaults to deterministic mock mode without credentials", () => {
    expect(providerConfiguration).toEqual({
      mode: "mock",
      characterProvider: "mock",
      guideProvider: "mock",
      liveAIEnabled: false,
    });
  });

  it("fails closed when an unsupported mode is requested", () => {
    expect(resolveProviderConfiguration("realtime")).toBe(providerConfiguration);
  });
});

