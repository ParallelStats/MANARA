import { describe, expect, it } from "vitest";

import {
  arabicMessages,
  englishMessages,
  extractMessagePlaceholders,
  formatMessage,
  formatPluralMessage,
  interpolateMessage,
  messages,
  requiredRouteMessageKeys,
  selectPluralCategory,
} from "@/i18n/messages";

function sortedKeys(value: Readonly<Record<string, string>>) {
  return Object.keys(value).sort();
}

describe("UI message catalogs", () => {
  it("keeps exact English and Arabic key parity", () => {
    expect(sortedKeys(arabicMessages)).toEqual(sortedKeys(englishMessages));
    expect(Object.keys(englishMessages).length).toBeGreaterThan(250);
  });

  it("provides a non-empty translation for every key in both locales", () => {
    for (const catalog of Object.values(messages)) {
      for (const value of Object.values(catalog)) {
        expect(value.trim()).not.toBe("");
      }
    }
  });

  it("does not introduce Arabic-only interpolation parameters", () => {
    for (const key of Object.keys(englishMessages) as (keyof typeof englishMessages)[]) {
      const englishParameters = new Set(extractMessagePlaceholders(englishMessages[key]));
      const arabicParameters = extractMessagePlaceholders(arabicMessages[key]);

      expect(
        arabicParameters.filter((parameter) => !englishParameters.has(parameter)),
        `Unexpected Arabic parameter for ${key}`,
      ).toEqual([]);
    }
  });

  it("covers every major route with critical localized chrome", () => {
    expect(Object.keys(requiredRouteMessageKeys).sort()).toEqual([
      "city",
      "errors",
      "fumbleMap",
      "landing",
      "scenario",
      "world",
    ]);

    for (const keys of Object.values(requiredRouteMessageKeys)) {
      expect(keys.length).toBeGreaterThan(0);

      for (const key of keys) {
        expect(englishMessages[key].trim()).not.toBe("");
        expect(arabicMessages[key].trim()).not.toBe("");
      }
    }
  });
});

describe("message formatting", () => {
  it("formats typed parameters in either locale", () => {
    expect(formatMessage("en", "metadata.cityExplore", { city: "Cairo" })).toBe(
      "Explore Cairo",
    );
    expect(formatMessage("ar", "metadata.cityExplore", { city: "القاهرة" })).toBe(
      "استكشف القاهرة",
    );
    expect(formatMessage("en", "voice.action.speak")).toBe("Speak your response");
  });

  it("throws rather than leaking an unresolved placeholder", () => {
    expect(() => interpolateMessage("Welcome to {city}, {name}", { city: "Cairo" }))
      .toThrowError("Missing message parameter: name");
  });

  it("treats interpolated learner-facing values as inert text", () => {
    const suppliedValue = '<img src=x onerror="alert(1)">';

    expect(interpolateMessage("Welcome, {name}", { name: suppliedValue })).toBe(
      `Welcome, ${suppliedValue}`,
    );
  });

  it("uses locale-aware English and Arabic plural categories", () => {
    expect(selectPluralCategory("en", 1)).toBe("one");
    expect(selectPluralCategory("en", 2)).toBe("other");
    expect(selectPluralCategory("ar", 0)).toBe("zero");
    expect(selectPluralCategory("ar", 1)).toBe("one");
    expect(selectPluralCategory("ar", 2)).toBe("two");
    expect(selectPluralCategory("ar", 3)).toBe("few");
    expect(selectPluralCategory("ar", 11)).toBe("many");
  });

  it("formats plural messages with the locale's number formatter", () => {
    expect(formatPluralMessage("en", "world.cityCount", 1)).toBe("1 city");
    expect(formatPluralMessage("en", "world.cityCount", 39)).toBe("39 cities");
    expect(formatPluralMessage("ar", "world.cityCount", 3)).toBe(
      `${new Intl.NumberFormat("ar").format(3)} مدن`,
    );
  });

  it("rejects non-finite plural counts", () => {
    expect(() => formatPluralMessage("en", "world.cityCount", Number.NaN))
      .toThrowError("Plural count must be finite.");
    expect(() => formatPluralMessage("ar", "world.cityCount", Number.POSITIVE_INFINITY))
      .toThrowError("Plural count must be finite.");
  });
});
