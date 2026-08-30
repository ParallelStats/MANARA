import { describe, expect, it } from "vitest";

import { destinations } from "@/content/destinations";
import { dialectVariants } from "@/content/linguistic-concepts";
import {
  getAuthoritativeDialectVariants,
  getContentValidationSummary,
  getEnterableScenarioBySlugs,
  validateContentRegistry,
} from "@/content/registry";

describe("content registry", () => {
  it("keeps only the three scenario-bearing destination records", () => {
    expect(destinations).toHaveLength(3);
    expect(destinations.map(({ name }) => [name.en, name.ar])).toEqual([
      ["Cairo", "القاهرة"],
      ["Abu Dhabi", "أبوظبي"],
      ["Casablanca", "الدار البيضاء"],
    ]);
    expect(destinations.map(({ countryName }) => [countryName.en, countryName.ar])).toEqual([
      ["Egypt", "مصر"],
      ["United Arab Emirates", "الإمارات العربية المتحدة"],
      ["Morocco", "المغرب"],
    ]);
  });

  it("keeps Casablanca non-enterable", () => {
    const casablanca = destinations.find(({ slug }) => slug === "casablanca");
    expect(casablanca?.availability).toBe("coming_soon");
    expect(casablanca?.scenarioIds).toEqual([]);
  });

  it("resolves the four functional arrival routes", () => {
    expect(getEnterableScenarioBySlugs("abu-dhabi", "cafe")?.scenario.id).toBe(
      "scenario-abu-dhabi-cafe",
    );
    expect(getEnterableScenarioBySlugs("cairo", "cafe")?.scenario.id).toBe(
      "scenario-cairo-cafe",
    );
    expect(getEnterableScenarioBySlugs("abu-dhabi", "campus")?.scenario.id).toBe(
      "scenario-abu-dhabi-campus",
    );
    expect(getEnterableScenarioBySlugs("cairo", "transport")?.scenario.id).toBe(
      "scenario-cairo-transport",
    );
    expect(getEnterableScenarioBySlugs("abu-dhabi", "majlis")).toBeUndefined();
    expect(getEnterableScenarioBySlugs("casablanca", "cafe")).toBeUndefined();
    expect(getEnterableScenarioBySlugs("riyadh", "cafe")).toBeUndefined();
  });

  it("keeps every seeded linguistic variant reviewed and normalized", () => {
    for (const variant of dialectVariants) {
      expect(variant.validationStatus).toBe("needs_review");
      expect(variant.publicationStatus).toBe("disabled");
      expect(variant.surfaceAr).toBe(variant.surfaceAr.normalize("NFC"));
    }
  });

  it("excludes review-pending content from authoritative teaching", () => {
    expect(getAuthoritativeDialectVariants()).toEqual([]);
    expect(getContentValidationSummary()).toEqual({ needsReview: 132, verified: 0 });
  });

  it("has no broken content references", () => {
    expect(validateContentRegistry()).toEqual([]);
  });
});
