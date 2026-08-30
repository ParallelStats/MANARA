import { describe, expect, it } from "vitest";

import { normalizeLearnerInput } from "@/application/evaluation/normalize-learner-input";

describe("learner-input normalization", () => {
  it("normalizes NFC, whitespace, tatweel, and optional Arabic diacritics", () => {
    expect(normalizeLearnerInput("  قَــهْوة\n  الآن  ")).toBe("قهوة الآن");
    expect(normalizeLearnerInput("ا\u0654ريد")).toBe("أريد");
  });

  it("does not collapse meaningful Arabic letter distinctions", () => {
    expect(normalizeLearnerInput("أ")).not.toBe(normalizeLearnerInput("ا"));
    expect(normalizeLearnerInput("ة")).not.toBe(normalizeLearnerInput("ه"));
    expect(normalizeLearnerInput("ي")).not.toBe(normalizeLearnerInput("ى"));
  });

  it("does not discard punctuation or change case", () => {
    expect(normalizeLearnerInput("FORM?  A")).toBe("FORM? A");
    expect(normalizeLearnerInput("FORM")).not.toBe(normalizeLearnerInput("form"));
  });
});

