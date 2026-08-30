import { describe, expect, it } from "vitest";

import { getTextDirection } from "@/i18n/direction";

describe("text direction", () => {
  it("uses right-to-left flow for Arabic", () => {
    expect(getTextDirection("ar")).toBe("rtl");
  });

  it("uses left-to-right flow for English", () => {
    expect(getTextDirection("en")).toBe("ltr");
  });
});
