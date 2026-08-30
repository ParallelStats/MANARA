import { describe, expect, it } from "vitest";

import { selectDestinationSummaries } from "@/application/travel/select-destination-summaries";
import { destinations } from "@/content/destinations";

describe("destination summaries", () => {
  it("retains dialect validation state instead of exposing an unqualified claim", () => {
    const summaries = selectDestinationSummaries(destinations);

    expect(summaries).toHaveLength(3);
    expect(summaries.every((summary) => summary.dialect.validationStatus === "needs_review")).toBe(true);
    expect(summaries.every((summary) => !("scenarioIds" in summary))).toBe(true);
  });

  it("preserves safe bilingual place metadata and availability", () => {
    expect(selectDestinationSummaries(destinations)).toContainEqual(
      expect.objectContaining({
        slug: "casablanca",
        name: { en: "Casablanca", ar: "الدار البيضاء" },
        countryName: { en: "Morocco", ar: "المغرب" },
        availability: "coming_soon",
        coordinates: [-7.5898, 33.5731],
      }),
    );
  });
});
