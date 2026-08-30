export const uiLocales = ["ar", "en"] as const;

export type UiLocale = (typeof uiLocales)[number];

export type UiTextDirection = "ltr" | "rtl";

export const appearancePreferences = ["system", "light", "dark"] as const;

export type AppearancePreference = (typeof appearancePreferences)[number];
export type ResolvedAppearance = Exclude<AppearancePreference, "system">;

export interface UiPreferenceEnvironment {
  readonly languages?: readonly string[];
  readonly prefersDark?: boolean;
}

export function isUiLocale(value: unknown): value is UiLocale {
  return typeof value === "string" && (uiLocales as readonly string[]).includes(value);
}

export function isAppearancePreference(value: unknown): value is AppearancePreference {
  return typeof value === "string" &&
    (appearancePreferences as readonly string[]).includes(value);
}

export function getUiTextDirection(locale: UiLocale): UiTextDirection {
  return locale === "ar" ? "rtl" : "ltr";
}

/**
 * Resolves the first supported browser language in preference order. Region
 * subtags are deliberately ignored because MANARA currently has one Arabic
 * UI and one English UI, not region-specific interface translations.
 */
export function resolveInitialLocale(languages: readonly string[] | undefined): UiLocale {
  for (const language of languages ?? []) {
    const baseLanguage = language.trim().toLowerCase().split(/[-_]/u)[0];
    if (baseLanguage === "ar" || baseLanguage === "en") return baseLanguage;
  }

  return "en";
}

/**
 * Unknown system appearance retains MANARA's established dark presentation
 * until the browser can report a preference. A known system value always wins
 * when the stored preference is `system`.
 */
export function resolveAppearance(
  appearance: AppearancePreference,
  prefersDark: boolean | undefined,
): ResolvedAppearance {
  if (appearance === "light" || appearance === "dark") return appearance;
  return prefersDark === false ? "light" : "dark";
}

export function readBrowserPreferenceEnvironment(): UiPreferenceEnvironment {
  if (typeof window === "undefined") return {};

  let languages: readonly string[] | undefined;
  let prefersDark: boolean | undefined;

  try {
    languages = window.navigator.languages.length > 0
      ? [...window.navigator.languages]
      : window.navigator.language
        ? [window.navigator.language]
        : undefined;
  } catch {
    languages = undefined;
  }

  try {
    prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  } catch {
    prefersDark = undefined;
  }

  return {
    ...(languages ? { languages } : {}),
    ...(prefersDark !== undefined ? { prefersDark } : {}),
  };
}
