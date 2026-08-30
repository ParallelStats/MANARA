import { describe, expect, it } from "vitest";

import {
  getUiTextDirection,
  isAppearancePreference,
  isUiLocale,
  readBrowserPreferenceEnvironment,
  resolveAppearance,
  resolveInitialLocale,
} from "@/i18n/ui-preferences";

describe("UI locale resolution", () => {
  it("uses the first supported browser locale in preference order", () => {
    expect(resolveInitialLocale(["fr-CA", "ar-AE", "en-US"])).toBe("ar");
    expect(resolveInitialLocale(["EN_gb", "ar"])).toBe("en");
  });

  it("falls back to English when no supported browser locale is available", () => {
    expect(resolveInitialLocale(undefined)).toBe("en");
    expect(resolveInitialLocale([])).toBe("en");
    expect(resolveInitialLocale(["fr", "de-DE"])).toBe("en");
  });

  it("resolves Arabic to RTL and English to LTR", () => {
    expect(getUiTextDirection("ar")).toBe("rtl");
    expect(getUiTextDirection("en")).toBe("ltr");
  });

  it("validates only supported locale and appearance values", () => {
    expect(isUiLocale("ar")).toBe(true);
    expect(isUiLocale("en")).toBe(true);
    expect(isUiLocale("ar-AE")).toBe(false);
    expect(isUiLocale(null)).toBe(false);

    expect(isAppearancePreference("system")).toBe(true);
    expect(isAppearancePreference("light")).toBe(true);
    expect(isAppearancePreference("dark")).toBe(true);
    expect(isAppearancePreference("auto")).toBe(false);
  });
});

describe("appearance resolution", () => {
  it("honors explicit light and dark preferences", () => {
    expect(resolveAppearance("light", true)).toBe("light");
    expect(resolveAppearance("dark", false)).toBe("dark");
  });

  it("follows the system value in system mode", () => {
    expect(resolveAppearance("system", true)).toBe("dark");
    expect(resolveAppearance("system", false)).toBe("light");
  });

  it("retains the established dark presentation while system state is unknown", () => {
    expect(resolveAppearance("system", undefined)).toBe("dark");
  });

  it("is safe to evaluate in the Node/SSR environment", () => {
    expect(readBrowserPreferenceEnvironment()).toEqual({});
  });
});
